+++
date = '2026-07-07T12:13:26+02:00'
years = ['2026']
draft = false
title = 'Moving ownership from C to Rust without cloning'
tags = ['rust', 'c', 'ffi']
seo = 'Move ownership of C-allocated UTF-8 strings into Rust without copying. Build a zero-copy FFI owner that carries the pointer, length, and C deallocator.'
og_image = 'og_image.png'
og_image_alt = 'A C buffer moves through a handoff into a Rust-owned string.'
+++

The real-time, performance-critical event processing engine I'm building is written in Rust and integrates with an existing C codebase.
It retains events for future correlation, so borrowing their data for a single FFI call is not enough: Rust must take ownership. In this article, I'm exploring a zero-copy FFI handoff for C-allocated UTF-8 strings: moving the allocation and its destructor into Rust without copying the contents.
The same technique works for other C allocations.

<!--more-->

## Table of Contents

- [The conventional copy](#the-conventional-copy)
- [Moving the allocation](#moving-the-allocation)
  - [Owning foreign bytes](#owning-foreign-bytes)
  - [Foreign strings](#foreign-strings)
  - [The FFI adapter](#the-ffi-adapter)
  - [The `Text` wrapper](#the-text-wrapper)
- [Copy vs. move performance](#copy-vs-move-performance)
- [The price of avoiding the copy](#the-price-of-avoiding-the-copy)

## The conventional copy

We'll start with the unsurprising C API.
It accepts a pointer and an exact byte length, so a NUL terminator is not required and embedded NUL bytes are allowed.

```c
typedef struct Event Event;

Event* event_new(const char* ptr, size_t len);
Event* event_new_unchecked(const char* ptr, size_t len);
void event_print(const Event* event);
void event_free(Event* event);
```

It exposes two API variants: checked and unchecked.
`event_new` performs UTF-8 validation and returns `NULL` upon failure.
`event_new_unchecked` skips that validation, making the caller responsible for providing valid UTF-8; violating this requirement is undefined behavior.

In this post, I'll stick with the `_unchecked` variants to maximize throughput.
When designing APIs, I like to provide checked variants for callers that cannot guarantee the same invariants.

The conventional implementation uses Rust's `std::string::String`, converting a borrowed FFI byte span into an owned `String`.

```rust
unsafe fn string_from_ffi<const CHECK_UTF8: bool>(
    ptr: *const c_char,
    len: usize,
) -> Option<String> {
    let ptr = NonNull::new(ptr.cast_mut())?;
    if len > isize::MAX as usize {
        return None;
    }

    let bytes = unsafe {
        slice::from_raw_parts(ptr.as_ptr().cast::<u8>(), len)
    };
    let text = if CHECK_UTF8 {
        str::from_utf8(bytes).ok()?
    } else {
        unsafe { str::from_utf8_unchecked(bytes) }
    };

    Some(text.to_owned())
}
```

`CHECK_UTF8` is a const generic: `true` validates the bytes, while `false` trusts the caller, so each exported entry point is specialized without a runtime policy branch.
The `isize::MAX` guard comes from [`slice::from_raw_parts`](https://doc.rust-lang.org/stable/std/slice/fn.from_raw_parts.html): a Rust slice's total byte size cannot exceed `isize::MAX`.

`text.to_owned()` is the important part.
It allocates a `String` and copies all `len` bytes.
Because this API only borrows the C buffer, Rust must allocate and copy before the call returns if it needs to retain the text in a `String`.
The exported constructor calls this utility directly and boxes the otherwise uninteresting event object:

```rust
#[unsafe(no_mangle)]
pub unsafe extern "C" fn event_new_unchecked(
    ptr: *const c_char,
    size: usize,
) -> *mut Event {
    catch_unwind(AssertUnwindSafe(|| {
        let Some(text) =
            (unsafe { string_from_ffi::<false>(ptr, size) })
        else {
            return ptr::null_mut();
        };

        Box::into_raw(Box::new(Event::new(text)))
    }))
    .unwrap_or(ptr::null_mut())
}
```

This implementation is simple, safe under a small FFI contract, and usually fast enough.
But the question remains - if C is finished with the buffer anyway, can we avoid the allocation and copy altogether?

## Moving the allocation

Moving rather than copying changes the FFI contract.
A pointer and a length describe the bytes, but Rust also needs to know how the allocation must eventually be released.
C therefore passes the matching destructor together with the allocation:

```c
typedef void (*FreeFn)(void* ptr);

Event* event_new_move(
    char* ptr,
    size_t len,
    FreeFn free_fn
);

Event* event_new_move_unchecked(
    char* ptr,
    size_t len,
    FreeFn free_fn
);
```

The move API deliberately uses `char*` rather than the borrowed API's `const char*`.
Rust still does not mutate the bytes, and C's type system does not encode ownership.
The function contract is what makes the allocation consumed.

For `malloc`, the deallocator will simply be `free`.
A custom allocator needs a matching release function.

Why not adopt the buffer with [`String::from_raw_parts`](https://doc.rust-lang.org/stable/std/string/struct.String.html#method.from_raw_parts)?
It requires the correct capacity and an allocation compatible with Rust's allocator.
An arbitrary `malloc` or pool allocation must instead be returned through its matching deallocator.

A complete C-side flow looks like this:

```c
#include "event.h"

#include <stdlib.h>
#include <string.h>

static Event* make_event(const char* source, size_t len) {
    char* payload = malloc(len == 0 ? 1 : len);
    if (payload == NULL) {
        return NULL;
    }

    if (len != 0) {
        memcpy(payload, source, len);
    }

    Event* event = event_new_move_unchecked(payload, len, free);
    payload = NULL; /* moved - do not touch or free it again */
    return event;
}

int main(void) {
    static const char input[] = "hello from C";
    Event* event = make_event(input, sizeof(input) - 1);
    if (event == NULL) {
        return 1;
    }

    event_print(event);
    event_free(event);
    return 0;
}
```

`make_event` must not call `free(payload)` after `event_new_move_unchecked`, even when the function returns `NULL`.
Once a non-null pointer and deallocator have been accepted, Rust owns the allocation.

That last rule deserves emphasis.
If either `ptr` or `free_fn` is null, the function rejects the call without taking ownership.
Once both are non-null, ownership transfers immediately, regardless of the return value.
In a production API, I would also expose a status - through an out-parameter or a result struct - so the caller can tell why construction failed.

### Owning foreign bytes

On the Rust side, those three values travel together in a small owner.

```rust
type FreeFn = unsafe extern "C" fn(*mut c_void);

pub struct ForeignBytes {
    ptr: NonNull<u8>,
    len: usize,
    free_fn: FreeFn,
}

impl ForeignBytes {
    pub unsafe fn from_raw_parts(
        ptr: NonNull<u8>,
        len: usize,
        free_fn: FreeFn,
    ) -> Self {
        debug_assert!(len <= isize::MAX as usize);
        Self { ptr, len, free_fn }
    }

    pub fn as_slice(&self) -> &[u8] {
        unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.len) }
    }
}

impl Drop for ForeignBytes {
    fn drop(&mut self) {
        unsafe { (self.free_fn)(self.ptr.as_ptr().cast()) };
    }
}

impl Deref for ForeignBytes {
    type Target = [u8];

    fn deref(&self) -> &Self::Target { self.as_slice() }
}

impl AsRef<[u8]> for ForeignBytes {
    fn as_ref(&self) -> &[u8] { self.as_slice() }
}

impl Borrow<[u8]> for ForeignBytes {
    fn borrow(&self) -> &[u8] { self.as_slice() }
}
```

The pointer and length provide immutable access to the payload.
The release function is the missing ownership metadata: when `ForeignBytes` is dropped, it receives the original pointer.
The type records no capacity and never grows or reallocates the storage.
`Deref`, `AsRef`, and `Borrow` let it participate in APIs built around ordinary byte slices.

`from_raw_parts` is unsafe because the caller must uphold the ownership contract.
The pointer must refer to `len` readable bytes in one allocation, `len` must not exceed `isize::MAX`, and the bytes must remain immutable until `Drop`.
The `free_fn` callback must remain callable and release that exact allocation.

### Foreign strings

`ForeignBytes` can own arbitrary data.
`ForeignString` is the text-specific layer: a newtype that guarantees those bytes are valid UTF-8 and can therefore expose the same allocation as `&str`.

```rust
pub struct ForeignString(ForeignBytes);

impl ForeignString {
    pub unsafe fn from_raw_parts(
        ptr: NonNull<u8>,
        len: usize,
        free_fn: FreeFn,
    ) -> Result<Self, Utf8Error> {
        let bytes = unsafe { ForeignBytes::from_raw_parts(ptr, len, free_fn) };
        str::from_utf8(bytes.as_slice())?;
        Ok(Self(bytes))
    }

    pub unsafe fn from_raw_parts_unchecked(
        ptr: NonNull<u8>,
        len: usize,
        free_fn: FreeFn,
    ) -> Self {
        Self(unsafe { ForeignBytes::from_raw_parts(ptr, len, free_fn) })
    }

    pub fn as_str(&self) -> &str {
        unsafe { str::from_utf8_unchecked(self.0.as_slice()) }
    }
}

impl Deref for ForeignString {
    type Target = str;

    fn deref(&self) -> &Self::Target { self.as_str() }
}

impl AsRef<str> for ForeignString {
    fn as_ref(&self) -> &str { self.as_str() }
}

impl Borrow<str> for ForeignString {
    fn borrow(&self) -> &str { self.as_str() }
}
```

The checked constructor validates once.
If validation fails, the local `ForeignBytes` is dropped and releases the already-moved allocation before returning the error.

The unchecked constructor does no work proportional to `len`.
Every later `as_str()` is sound only because the caller promised valid UTF-8 and because nobody can mutate the bytes after the move.
The matching `Deref`, `AsRef`, and `Borrow` implementations make `ForeignString` work with APIs expecting a string slice.

### The FFI adapter

The `event_new_move_*` APIs need an equivalent to `string_from_ffi`.
`foreign_string_from_ffi` accepts the C-facing arguments and returns either a new `ForeignString` or `None` when the input is rejected.

```rust
unsafe fn foreign_string_from_ffi<const CHECK_UTF8: bool>(
    ptr: *mut c_char,
    len: usize,
    free_fn: Option<FreeFn>,
) -> Option<ForeignString> {
    let ptr = NonNull::new(ptr)?;
    let free_fn = free_fn?;

    if len > isize::MAX as usize {
        unsafe { free_fn(ptr.as_ptr().cast()) };
        return None;
    }

    if CHECK_UTF8 {
        unsafe {
            ForeignString::from_raw_parts(ptr.cast(), len, free_fn)
        }.ok()
    } else {
        Some(unsafe {
            ForeignString::from_raw_parts_unchecked(ptr.cast(), len, free_fn)
        })
    }
}
```

The null checks happen before the ownership boundary.
The length check happens after it, so an oversized allocation is released without ever being dereferenced.
At this point, Rust has zero-copy ownership of the original C allocation.

### The `Text` wrapper

My event datatype must also support construction from native Rust strings, so its string field must support both `String` and `ForeignString`.
`Text` serves as a convenience wrapper for doing just that:

```rust
pub enum Text {
    Rust(String),
    Foreign(ForeignString),
}

impl Text {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Rust(text) => text,
            Self::Foreign(text) => text.as_str(),
        }
    }
}

impl Clone for Text {
    fn clone(&self) -> Self {
        Self::from(self.as_str())
    }
}

impl Deref for Text {
    type Target = str;

    fn deref(&self) -> &Self::Target { self.as_str() }
}

impl AsRef<str> for Text {
    fn as_ref(&self) -> &str { self.as_str() }
}

impl Borrow<str> for Text {
    fn borrow(&self) -> &str { self.as_str() }
}

impl From<String> for Text {
    fn from(text: String) -> Self { Self::Rust(text) }
}

impl From<ForeignString> for Text {
    fn from(text: ForeignString) -> Self { Self::Foreign(text) }
}
```

If a datatype never needs both origins, introducing `Text` would add indirection and API surface for no benefit.

Cloning `Text` deliberately creates a new Rust-owned `String`.
Sharing the same foreign pointer between two independently dropped values would double-free it, so a deep copy is the unsurprising `Clone` behavior.
Sharing is possible too: we could wrap `ForeignString` in `Rc` or `Arc`, and the foreign deallocator will run after the last handle is dropped.

The FFI function now constructs `ForeignString` first, then wraps it in `Text` only because this particular event supports both storage models:

```rust
#[unsafe(no_mangle)]
pub unsafe extern "C" fn event_new_move_unchecked(
    ptr: *mut c_char,
    len: usize,
    free_fn: Option<FreeFn>,
) -> *mut Event {
    catch_unwind(AssertUnwindSafe(|| {
        let Some(text) = (unsafe {
            foreign_string_from_ffi::<false>(ptr, len, free_fn)
        }) else {
            return ptr::null_mut();
        };

        Box::into_raw(Box::new(Event::from_text(Text::from(text))))
    }))
    .unwrap_or(ptr::null_mut())
}
```

I am intentionally not going into the rest of the `Event` API - that is business logic and will differ for every use case.

Normal Rust unwinding will drop the `ForeignString`, directly or through `Text`, by calling the foreign deallocator.
The returned `Event*` remains an opaque Rust allocation and must eventually go through `event_free` exactly once.

## Copy vs. move performance

I benchmarked the APIs on an AMD Ryzen Threadripper PRO 7955WX.
Each result below is the construction-time point estimate from a release build, with 64 events per batch.

The setup deliberately creates the input allocation outside the timed region.
That models the scenario in question: C already owns a populated heap buffer.
`event_new_unchecked` measures the additional Rust allocation and copy, while `event_new_move_unchecked` measures only the ownership wrapper and the same boxed event.

| Bytes | `event_new_unchecked` | `event_new_move_unchecked` | Speed-up |
|---:|---:|---:|---:|
| 128 | 39.29 ns | 21.83 ns | 1.80x |
| 256 | 49.09 ns | 22.20 ns | 2.21x |
| 512 | 49.90 ns | 22.30 ns | 2.24x |
| 1,024 | 56.80 ns | 22.42 ns | 2.53x |
| 2,048 | 62.40 ns | 22.15 ns | 2.82x |
| 4,096 | 76.96 ns | 22.43 ns | 3.43x |
| 8,192 | 135.74 ns | 23.41 ns | 5.80x |

The move remains at roughly 22-23 ns because it neither scans nor copies the payload.
The copy becomes increasingly expensive as the string grows.
At 128 bytes, moving reduces construction time by about 44%; at 8 KiB, the reduction is about 83%.

For comparison, here are the same measurements using the checked entry points:

| Bytes | `event_new` | `event_new_move` | Speed-up |
|---:|---:|---:|---:|
| 128 | 42.83 ns | 25.43 ns | 1.68x |
| 256 | 52.94 ns | 28.11 ns | 1.88x |
| 512 | 62.14 ns | 33.52 ns | 1.85x |
| 1,024 | 72.28 ns | 40.24 ns | 1.80x |
| 2,048 | 89.98 ns | 54.45 ns | 1.65x |
| 4,096 | 132.88 ns | 88.03 ns | 1.51x |
| 8,192 | 242.27 ns | 146.04 ns | 1.66x |

Both checked constructors scan the complete payload, so `event_new_move` is no longer constant-time with respect to the string length.
It still avoids the second allocation and byte copy, remaining about 1.5-1.9x faster in this run.

This does not shift the cost to cleanup.
In a separate benchmark, destroying both Rust-owned and foreign-owned values took roughly 18-35 ns across these sizes.
The callback used to free foreign-owned values added no measurable overhead in this benchmark.

## The price of avoiding the copy

The biggest downside is codebase pollution.

Rust code naturally wants to store a `String` and accept `&str`.
This design replaces `String` with a custom `ForeignString` or `Text`.
Both choices spend code recreating traits and conveniences the standard type already had.

The safety contract is also substantial.
The pointer must be the allocation base expected by the callback.
The bytes must stay alive, readable, immutable and valid UTF-8 until destruction.
The callback must remain loaded, use the matching allocator, work on the destruction thread and never unwind across the ABI.
The C side must not touch or free the pointer after transfer, even if the constructor returns `NULL` after accepting it.

Finally, this article assumes UTF-8.
That assumption is what lets foreign bytes become a normal Rust `&str` without transcoding.
Supporting UTF-16 strings, as commonly encountered on Windows, would be considerably trickier.
A UTF-16 allocation cannot be trivially exposed as `&str`; we would either transcode it into a new UTF-8 `String` and lose the zero-copy property, or introduce custom wide-string owners and slice types backed by `&[u16]`.
Those types would then spread through the codebase alongside `ForeignString` and possibly `Text`, polluting the codebase even further.

This route is worth taking only when ultimate performance is the priority and profiling shows the allocation and copy matter.
For everything else, copying into a plain `String` is typically good enough.

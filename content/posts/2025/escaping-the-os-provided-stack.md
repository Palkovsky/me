+++
date = '2025-11-10T12:00:00+02:00'
years = ['2025']
draft = false
title = 'Escaping the OS-provided stack'
tags = ['assembly', 'low level', 'hacking', 'c', 'rust']
+++

User-space stacks can grow to considerable sizes - megabytes and more. 
The size of the stack is not really a limitation there.
However, it can still become a problem for low-level environments such as kernel space, firmware, and embedded OSes.
Such targets typically come with tiny, fixed-size stacks - not more than a few pages of memory.
This post explores a last-resort technique to bypass such a limitation.

<!--more-->

## Table of Contents
- [Act 1: `regex` in Linux kernel](#act-1-regex-in-linux-kernel)
- [Act 2: Proof of Concept](#act-2-proof-of-concept)
- [Act 3: Rock & Roll](#act-3-rock--roll)
  - [Without the stack switch](#without-the-stack-switch)
  - [Limitations](#limitations)
- [Finale: Stackaroo](#finale-stackaroo)

# Act 1: [`regex`](https://github.com/rust-lang/regex) in Linux kernel

The inspiration to write this post came from research on adapting common Rust crates such as [regex](https://github.com/rust-lang/regex) to run as part of a Linux kernel module.
The issue I faced was substantial stack usage, causing general protection faults in address ranges close to the `rsp`.
It turned out the **`regex`** crate expected a bit more stack than kernel space could offer, which is 16kB on x64.

This problem can be simulated from user space by applying the stack limit using **`ulimit -s`** and running a sample program.
Through trial and error, I found that the **`regex`** crate remains stable across multiple runs with a stack size of approximately 40 kB.

```rs
use regex::Regex;

fn main() {
    let re = Regex::new(r"^[a-zA-Z]+$").unwrap(); // Only alphabetic words
    assert!(re.is_match("foo"));
}
```

```bash
$ ulimit -s
    8192 # kB
$ ./regex-test ; echo $?
0

# Limit stack to 16kB
$ ulimit -s 16
$ ./regex-test ; echo $?
Segmentation fault (core dumped)
139
```

But the question remains - how to overcome this limitation in an environment where the stack size cannot be easily increased?

# Act 2: Proof of Concept

The bypass will be performed from our program. The goal is to:
 1. Preserve the current `rsp` in a static variable.
 2. Swap the `rsp` to a user-controlled buffer (backed by global memory in this example, though it could also be heap-backed).
 3. Call a callback on the new "stack".
 4. Restore the original stack pointer after the callback returns.

```c
#include <stdio.h>

void my_callback(void* arg) {
    printf("In callback with arg: %p\n", arg);
}

__attribute__((noinline)) void switch_stack(
    void (*callback)(void*),
    void* arg
) {
    static void* OLD_SP = NULL;
    static void(*CALLBACK_FN)(void*) = NULL;
    static void* CALLBACK_ARG = NULL;
    static char AUX_STACK[1 << 20] __attribute__((aligned(16))); // 1MB, 16-byte aligned
    static void* NEW_SP = AUX_STACK + sizeof(AUX_STACK);

    CALLBACK_FN = callback;
    CALLBACK_ARG = arg;

    // Save rsp to OLD_SP and switch to NEW_SP
    __asm__ volatile (
        "mov %%rsp, %0\n"
        "mov %1, %%rsp\n"
        : "=m"(OLD_SP)
        : "r"(NEW_SP)
    );

    // Call the callback function
    CALLBACK_FN(CALLBACK_ARG);

    // Restore old rsp
    __asm__ volatile (
        "mov %0, %%rsp\n"
        :
        : "m"(OLD_SP)
    );
}

int main() {
    switch_stack(my_callback, (void*)0xDEADBEEF);
    return 0;
}
```

----

The **`switch_stack`** function accepts a pointer to a callback that will be called on the new stack and a **`void*`** argument.
The function is marked as **`noinline`** to prevent it from being merged into the caller's frame.
This gives it its own predictable frame layout, making it easier to debug - though it should work as expected even when inlined.

```c
__attribute__((noinline)) void switch_stack(
    void (*callback)(void*),
    void* arg
)
```

----

The function defines a set of static variables to hold the context after the stack switch.
We want to avoid local variables as much as possible.
If the compiler emits an instruction referencing local stack data (e.g., **`mov rax, [rsp+0x08]`**) after **`rsp`** is swapped, the program will likely crash.

- **`OLD_SP`** - stores the original stack pointer so we can restore it after the callback completes
- **`CALLBACK_FN`** - holds the callback function pointer in static storage
- **`CALLBACK_ARG`** - holds the callback argument in static storage
- **`AUX_STACK`** - a static 1MB array serving as backing storage for the new stack, with 16-byte alignment required by x64 ABI
- **`NEW_SP`** - lazily initialized to point to the 16-byte aligned end of **`AUX_STACK`** since the stack grows downward

```c
    static void* OLD_SP = NULL;
    static void(*CALLBACK_FN)(void*) = NULL;
    static void* CALLBACK_ARG = NULL;
    static char AUX_STACK[1 << 20] __attribute__((aligned(16))); // 1MB, 16-byte aligned
    static void* NEW_SP = AUX_STACK + sizeof(AUX_STACK);
```

----

Before performing the stack swap, we copy the arguments to static storage.
After **`rsp`** is swapped, we cannot safely access any existing local variables.
If the local variable gets referenced using **`rsp`**-relative addressing, the program will likely crash.
However, if locals are accessed through **`rbp`**-relative instructions (e.g. **`mov rax, [rbp+0x8]`**), it will actually keep working fine as the **`rbp`** was left untouched after the swap.

In practice, **`rbp`**-relative addressing is used in unoptimized builds, so it's just better to avoid referencing locals after the swap altogether.

```c
    CALLBACK_FN = callback;
    CALLBACK_ARG = arg;

    __asm__ volatile (
        "mov %%rsp, %0\n" // Store rsp in OLD_SP
        "mov %1, %%rsp\n" // Load NEW_SP into rsp
        : "=m"(OLD_SP)
        : "r"(NEW_SP)
    );
```

----

To minimize inline assembly and maintain portability, we call the callback using C code.
This avoids the complexity of dealing with ABI-related calling conventions.

```c
CALLBACK_FN(CALLBACK_ARG);
```

----

After the stack is restored, it would be safe again to access **`switch_stack`** local variables - if there were any.

```c
    __asm__ volatile (
        "mov %0, %%rsp\n"
        :
        : "m"(OLD_SP)
    );
```

----

The program appears to work as expected:

```bash
# Unoptimized build
$ gcc main.c
./a.out
In callback with arg: 0xdeadbeef

# Optimized build
$ gcc -O3 main.c
$ ./a.out
In callback with arg: 0xdeadbeef
```

----

The compiled function doesn't emit any instructions accessing **`[rsp+offset]`** after the stack swap, confirming the static variable approach works as intended. All memory accesses use **`rip`**-relative addressing (**`[rip+offset]`**), which references global/static variables independently of the stack pointer.

```bash
# UNOPTIMIZED
0000000000001177 <switch_stack>:
    1177:       f3 0f 1e fa             endbr64
    117b:       55                      push   rbp
    117c:       48 89 e5                mov    rbp,rsp
    117f:       48 83 ec 10             sub    rsp,0x10
    1183:       48 89 7d f8             mov    QWORD PTR [rbp-0x8],rdi
    1187:       48 89 75 f0             mov    QWORD PTR [rbp-0x10],rsi
    118b:       48 8b 45 f8             mov    rax,QWORD PTR [rbp-0x8]
    118f:       48 89 05 aa 2e 00 00    mov    QWORD PTR [rip+0x2eaa],rax        # 4040 <CALLBACK_FN.4>
    1196:       48 8b 45 f0             mov    rax,QWORD PTR [rbp-0x10]
    119a:       48 89 05 a7 2e 00 00    mov    QWORD PTR [rip+0x2ea7],rax        # 4048 <CALLBACK_ARG.3>
    11a1:       48 8b 05 68 2e 00 00    mov    rax,QWORD PTR [rip+0x2e68]        # 4010 <NEW_SP.2>
    11a8:       48 89 25 a1 2e 00 00    mov    QWORD PTR [rip+0x2ea1],rsp        # 4050 <OLD_SP.1>
    11af:       48 89 c4                mov    rsp,rax
    11b2:       48 8b 15 87 2e 00 00    mov    rdx,QWORD PTR [rip+0x2e87]        # 4040 <CALLBACK_FN.4>
    11b9:       48 8b 05 88 2e 00 00    mov    rax,QWORD PTR [rip+0x2e88]        # 4048 <CALLBACK_ARG.3>
    11c0:       48 89 c7                mov    rdi,rax
    11c3:       ff d2                   call   rdx
    11c5:       48 8b 25 84 2e 00 00    mov    rsp,QWORD PTR [rip+0x2e84]        # 4050 <OLD_SP.1>
    11cc:       90                      nop
    11cd:       c9                      leave
    11ce:       c3                      ret

# O3
0000000000001190 <switch_stack>:
    1190:       f3 0f 1e fa             endbr64
    1194:       48 89 f8                mov    rax,rdi
    1197:       48 83 ec 08             sub    rsp,0x8
    119b:       48 89 f7                mov    rdi,rsi
    119e:       48 89 35 a3 2e 10 00    mov    QWORD PTR [rip+0x102ea3],rsi        # 104048 <CALLBACK_ARG.3>
    11a5:       48 89 05 a4 2e 10 00    mov    QWORD PTR [rip+0x102ea4],rax        # 104050 <CALLBACK_FN.4>
    11ac:       48 8d 15 8d 2e 10 00    lea    rdx,[rip+0x102e8d]        # 104040 <OLD_SP.1>
    11b3:       48 89 25 86 2e 10 00    mov    QWORD PTR [rip+0x102e86],rsp        # 104040 <OLD_SP.1>
    11ba:       48 89 d4                mov    rsp,rdx
    11bd:       ff d0                   call   rax
    11bf:       48 8b 25 7a 2e 10 00    mov    rsp,QWORD PTR [rip+0x102e7a]        # 104040 <OLD_SP.1>
    11c6:       48 83 c4 08             add    rsp,0x8
    11ca:       c3                      ret
```

# Act 3: Rock & Roll

So, will this technique actually work in the Linux kernel? After all, this is the place where the stack limitations bit me in the butt.

This module uses the stack excessively to demonstrate the technique under real constraints.
The **`stack_heavy_callback`** function allocates 512 kB on the stack - exceeding the kernel's 16 kB limit by a large margin. 

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Dawid Macek");
MODULE_DESCRIPTION("A simple Hello World Linux kernel module");
MODULE_VERSION("1.0");

#define AUX_STACK_SIZE (1 << 20) // 1MB
#define BIG_BUFFER_SIZE (1 << 19) // 512kB

noinline void switch_stack(
    void (*callback)(void*),
    void* arg
) { /* CUT */ };

static void stack_heavy_callback(void* arg) {
    int i;
    // 512kB on the stack. Will surely crash the kernel.
    volatile char large_stack_array[BIG_BUFFER_SIZE];
    // Use the array to avoid optimization.
    for (i = 0; i < BIG_BUFFER_SIZE; ++i) {
        large_stack_array[i] = i % 256;
    }
    printk(KERN_INFO "Inside stack heavy callback.\n");
}

static int __init hello_init(void)
{
    printk(KERN_INFO "Module loaded.\n");
    switch_stack(stack_heavy_callback, NULL);
    // stack_heavy_callback(NULL);
    printk(KERN_INFO "After stack swap.\n");
    return 0;
}

static void __exit hello_exit(void)
{
    printk(KERN_INFO "Module unloaded.\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

When compiling, all the sirens and alarm bells are going off, but we aren't stopping. Safety? Always off.

```bash
$ make
make -C /lib/modules/5.15.0-91-generic/build M=/vagrant/linux modules
make[1]: Entering directory '/usr/src/linux-headers-5.15.0-91-generic'
warning: the compiler differs from the one used to build the kernel
  The kernel was built by: gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
  You are using:           gcc (Ubuntu 11.4.0-1ubuntu1~22.04.2) 11.4.0
  CC [M]  /vagrant/linux/hello.o
/vagrant/linux/hello.c: In function ‘stack_heavy_callback’:
/vagrant/linux/hello.c:22:1: warning: the frame size of 524296 bytes is larger than 1024 bytes [-Wframe-larger-than=]
   22 | }
      | ^
  MODPOST /vagrant/linux/Module.symvers
  CC [M]  /vagrant/linux/hello.mod.o
  LD [M]  /vagrant/linux/hello.ko
  BTF [M] /vagrant/linux/hello.ko
Skipping BTF generation for /vagrant/linux/hello.ko due to unavailability of vmlinux
make[1]: Leaving directory '/usr/src/linux-headers-5.15.0-91-generic
```

Against all odds, the module loads and executes without crashing.
The stack switch successfully provides enough space for the callback to complete its work.

```bash
$ sudo dmesg --follow
[ 1325.550820] Module loaded.
[ 1325.551042] Inside stack heavy callback.
[ 1325.551042] After stack swap.
```

## Without the stack switch

If **`stack_heavy_callback`** is called directly without the stack switch, we can expect either an oops or a complete kernel panic.
In this case, we got an oops.
Looking at the page fault address and **`rsp`**, it's clear the code attempted to access memory outside the allocated stack bounds.

```bash
[ 1658.348625] BUG: unable to handle page fault for address: ffffa40d83602000
[ 1658.348831] #PF: supervisor write access in kernel mode
[ 1658.348977] #PF: error_code(0x0002) - not-present page
[ 1658.349116] PGD 100000067 P4D 100000067 PUD 1001e3067 PMD 2d37f067 PTE 0
[ 1658.349323] Oops: 0002 [#1] SMP NOPTI
[ 1658.349460] CPU: 3 PID: 9642 Comm: insmod Tainted: G           OE     5.15.0-91-generic #101-Ubuntu
[ 1658.349590] Hardware name: Microsoft Corporation Virtual Machine/Virtual Machine, BIOS 090008  09/01/2023
[ 1658.349749] RIP: 0010:stack_heavy_callback.constprop.0+0x3f/0x81 [hello]
[ 1658.349902] Code: 65 48 8b 04 25 28 00 00 00 48 89 45 e8 31 c0 4c 63 e3 49 81 fc ff ff 07 00 76 0f 4c 89 e6 48 c7 c7 00 60 cd c0 e8 b1 ed 7b d0 <42> 88 9c 25 e8 ff f7 ff ff c3 81 fb 00 00 08 00 75 d3 48 c7 c7 58
[ 1658.350171] RSP: 0018:ffffa40d835a7c28 EFLAGS: 00010293
[ 1658.350307] RAX: 0000000000000000 RBX: 000000000005a3d8 RCX: 0000000000000000
[ 1658.350442] RDX: 0000000000000000 RSI: ffff8a3ec3da0580 RDI: ffff8a3ec3da0580
[ 1658.350578] RBP: ffffa40d83627c40 R08: 0000000000000003 R09: fffffffffffcb188
[ 1658.350713] R10: 0000000000000012 R11: 0000000000000001 R12: 000000000005a3d8
[ 1658.350849] R13: ffff8a3dc8630ad0 R14: 0000000000000000 R15: ffffffffc0cd6040
[ 1658.350984] FS:  00007f5fef75d000(0000) GS:ffff8a3ec3d80000(0000) knlGS:0000000000000000
[ 1658.351120] CS:  0010 DS: 0000 ES: 0000 CR0: 0000000080050033
[ 1658.351291] CR2: ffffa40d83602000 CR3: 000000000200e000 CR4: 00000000003506e0
```

The culprit instruction, corresponding to the **`large_stack_array[i] = i % 256;`** attempts to write to a stack address that doesn't exist.

```bash
  3f:   42 88 9c 25 e8 ff f7    mov    BYTE PTR [rbp+r12*1-0x80018],bl
```

## Limitations

This technique comes with severe caveats:

- **Stack unwinding breaks**: If the callback panics or throws an exception, the unwinding mechanism won't be able to traverse back to the original stack properly, likely crashing the program. I've had some success with [catching panics](https://github.com/Palkovsky/stackaroo/blob/ea5425cec98ef44b8de67ed91c87a347b5f240e6/examples/panic.rs#L14) on Linux-based platforms, but it doesn't seem to work on Windows.
- **Debuggers get confused**: Debugging tools will be confused by the non-standard stack layout.
- **No recursive swaps**: You cannot swap stacks within an already stack-swapped function - the static variables are already in use. Working around this would require extensive inline assembly, reducing portability.
- **Possibly breaks exploit-prevention solutions?**: If I were developing one, I'd be checking if the **`rsp`** falls into an expected memory range.

Despite these limitations, the technique remains valuable in constrained environments where other solutions aren't feasible.

# Finale: [Stackaroo](https://github.com/Palkovsky/stackaroo)

After successfully using this technique in both user space and kernel modules, I packaged it into a reusable Rust library - **[stackaroo](https://github.com/Palkovsky/stackaroo)**.
The library provides a clean API with support for x64 and ARM64 architectures, and comes wiha a C FFI layer.
You can learn more reading the [docs](https://docs.rs/stackaroo/latest/stackaroo/).
+++
date = '2025-10-05T18:44:36+02:00'
years = ['2025']
draft = false
title = 'eBPF + LSM: Synchronous Execution Prevention'
tags = []
+++

LSM (Linux Security Modules) hooks offer a way to synchronously stop certain actions from taking place on a Linux system.
This capability might, over the time, become widely adapted by various security products.
Let's explore a simple use-case scenario of blocking execution of pre-configured executables stored on the filesystem.

<!--more-->

# Environment

I'm using `Ubuntu 22.04` VM with a generic `5.15` kernel. 
The important bit is to ensure tha kernel was compiled with `CONFIG_BPF_LSM` and that grub boots it with eBPF for LSM turned on.

```bash
$ cat /boot/config-$(uname -r)  | grep CONFIG_BPF_LSM
CONFIG_BPF_LSM=y
$ cat /etc/default/grub | grep lsm
GRUB_CMDLINE_LINUX="lsm=lockdown,capability,landlock,yama,apparmor,bpf"
```

# Finding the right hook

Hooks are stored within the [`union security_list_options`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/include/linux/lsm_hooks.h#L38):

```c
union security_list_options {
	#define LSM_HOOK(RET, DEFAULT, NAME, ...) RET (*NAME)(__VA_ARGS__);
	#include "lsm_hook_defs.h"
	#undef LSM_HOOK
	void *lsm_func_addr;
};
```

Actual listing can be found in the [lsm_hooks_defs.h](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/include/linux/lsm_hook_defs.h):

```c
LSM_HOOK(int, 0, binder_set_context_mgr, const struct cred *mgr)
LSM_HOOK(int, 0, binder_transaction, const struct cred *from,
	 const struct cred *to)
LSM_HOOK(int, 0, binder_transfer_binder, const struct cred *from,
	 const struct cred *to)
...
```

The union holds a single pointer (union, duh...) to a hook. The macro expands to:

```c
union security_list_options {
	int (*binder_set_context_mgr)(const struct cred *);
	int (*binder_transaction)(const struct cred *, const struct cred *);
	int (*binder_transfer_binder)(const struct cred *, const struct cred *);
    ...
    void *lsm_func_addr;
}
```

## Capturing `execve`

Since the goal is to block execution of a given executable, we need to know which hook gets called on the `execve` syscall.
Grepping the definition list doesn't lead to anything obvious (not a Linux kernel pro).
We need to look into the actual syscall call implementation.

As we walk [do_execve](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1928) -> [do_execveat_common](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1784) -> [bprm_execve](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1730) -> [exec_binprm](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1685) -> [search_binary_handler](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1651), we'll eventually encounter a call to [`security_bprm_check`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/security/security.c#L1339). 
The returned value short-circuts the system call, propagating the return value up to `do_execve`.

This is exactly what we want - synchronous hook inside a system call!

```c
static int search_binary_handler(struct linux_binprm *bprm)
{
	struct linux_binfmt *fmt;
	int retval;

	retval = prepare_binprm(bprm);
	if (retval < 0)
		return retval;

	retval = security_bprm_check(bprm);
	if (retval)
		return retval;
    ...
}
```

[`security_bprm_check`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/security/security.c#L1339) itself is a beautifully documented function, calling the `bprm_check_security` that's also present in the [lsm_hooks_defs.h](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/include/linux/lsm_hook_defs.h).

```c
/**
 * security_bprm_check() - Mediate binary handler search
 * @bprm: binary program information
 *
 * This hook mediates the point when a search for a binary handler will begin.
 * It allows a check against the @bprm->cred->security value which was set in
 * the preceding creds_for_exec call.  The argv list and envp list are reliably
 * available in @bprm.  This hook may be called multiple times during a single
 * execve.  @bprm contains the linux_binprm structure.
 *
 * Return: Returns 0 if the hook is successful and permission is granted.
 */
int security_bprm_check(struct linux_binprm *bprm)
{
	return call_int_hook(bprm_check_security, bprm);
}
```

It indicates that `bprm_check_security` should be our probe point:
```c
LSM_HOOK(int, 0, bprm_check_security, struct linux_binprm *bprm)
```

# PoC using the `bpftrace`

[bpftrace](https://github.com/bpftrace/bpftrace) is a neat tool to write little eBPF programs in a script-like language. 
It can be used for prototyping or validating if a hook triggers when expected.
The tool uses custom naming for probes, but we should be able to locate the right one with `grep`:

```sh
$ bpftrace -l | grep bprm_check_security
kfunc:bpf_lsm_bprm_check_security  <- Most likely
kprobe:bpf_lsm_bprm_check_security <- kfuncs prefered
```

`-v` can be added to examine arguments:

```bash
$ bpftrace -vl kfunc:bpf_lsm_bprm_check_security
kfunc:bpf_lsm_bprm_check_security
    struct linux_binprm * bprm
    int retval
```

This sample program prints out the `comm` identifier of the parent process and the `filename` of the executed binary held inside the [`struct bprm`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/include/linux/binfmts.h#L18) (binary program): 

```bash
$ sudo bpftrace -e '
kfunc:bpf_lsm_bprm_check_security 
{
    printf("comm=%s filename=%s\n", comm, str(args->bprm->filename));
}'
Attaching 1 probe...
# Executing stuff in a different shell
comm=bash filename=/usr/bin/ls
comm=bash filename=/usr/bin/ping
comm=bash filename=/usr/bin/netcat
```

This is great, but it's just a simple "audit" probe - we can do that without LSM. 
Unfortunately, `bpftrace` doesn't support overriding a return value, as it focuses on observability rather than prevention.
We need to build a fully-fledged eBPF program to get the active blocking behavior. 

# Step 1: Blocking `/usr/bin/ls`

The initial goal is to block a hard-coded executable.
The eBPF application needs to parse out a path from the [`struct bprm`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/include/linux/binfmts.h#L18), and apply a bounded [`strncmp`](https://en.cppreference.com/w/c/string/byte/strncmp)-like logic onto it.
Important caveat is that kernel-owned path must be copied to the eBPF-owned memory, either to a map or onto the stack.
eBPF programs (kernel helper functions being an exception) can not work on kernel-owned pointers directly.
Considering the stack limit of 512 bytes and filesystem path limit being 4096 bytes, the per-cpu buffer is a good candidate for storing the path eBPF side.

Walking the [`struct dentry`](https://github.com/torvalds/linux/blob/56019d4ff8dd5ef16915c2605988c4022a46019c/include/linux/dcache.h#L92) linked list in eBPF and converting it to a string is a post idea on its own.
So... to keep this LSM-focused and concise I'll use a pre-existing functionality borrowed from the [tracee](https://github.com/aquasecurity/tracee/tree/main) project ❤️.
The function I'm interested in is [`get_path_str`](https://github.com/aquasecurity/tracee/blob/0c57dbe2fc4480798841b6ddf80b4ad707dc4755/pkg/ebpf/c/common/filesystem.h#L281).
It converts a [`struct path`](https://github.com/torvalds/linux/blob/56019d4ff8dd5ef16915c2605988c4022a46019c/include/linux/path.h#L8) into an eBPF-owned (held in a per-cpu array) `void*` pointer. 

```c
char LICENSE[] SEC("license") = "Dual MIT/GPL";

#define MAX_PATH_LEN 4096

static int str_equal(const char *s1, const char *s2, int max_len) {
    for (int i = 0; i < max_len; i++) {
        char c1 = s1[i];
        char c2 = s2[i];
        if (c1 != c2)
            return 0;
        if (c1 == '\0')
            return 1;
    }
    return 1;
}

SEC("lsm/bprm_check_security")
int BPF_PROG(handle_bprm_check_security, struct linux_binprm *bprm) {
    struct path path = BPF_CORE_READ(bprm, file, f_path);
    const char* filepath = get_path_str(&path);
    if (!filepath) {
        return 0;
    }

	if (str_equal(filepath, "/usr/bin/ls", MAX_PATH_LEN)) {
		bpf_printk("bprm_check_security: execution blocked");
		return -EPERM;
	} else {
		return 0;
	}
}
```

**Note:** [`struct bprm`](https://github.com/torvalds/linux/blob/971199ad2a0f1b2fbe14af13369704aff2999988/include/linux/binfmts.h#L18) holds a `filename` field, so this is probably a "proper" way to get the executable path in this specific hook. 
However, having the ability to convert [`struct path`](https://github.com/torvalds/linux/blob/56019d4ff8dd5ef16915c2605988c4022a46019c/include/linux/path.h#L8) into a string opens up a door for many powerful functionalities in other hooks.

# User-space loader

[libbpf-rs](https://github.com/libbpf/libbpf-rs) will be used to create a user-space loader of the eBPF application.
The repository contains multiple examples on setting up a starter project.
Typical setup consists of two components:

- Compile-time skeleton generator, invoking `clang` on the `*.bpf.c` sources (`build.rs`)
- Application responsible for instantiating an actual eBPF program from the skeleton. Can optionally fill maps and read-only data with initial values or consume events from the ring/perf buffers (`main.rs`)

The loader in this case initializes an eBPF application from the build-time generated `lsm::LsmSkelBuilder`.

```rust
use anyhow::{Result, bail};
use libbpf_rs::{*, skel::*};
use plain::Plain;
use std::ffi::CString;
use std::str::FromStr;

fn main() -> Result<()> {
	// These structs are build-time generated, based on the *.ebf.c program
    let mut skel_builder = lsm::LsmSkelBuilder::default();
    skel_builder.obj_builder.debug(true);

    bump_memlock_rlimit()?;

    let mut open_object = std::mem::MaybeUninit::uninit();
    let open_skel = skel_builder.open(&mut open_object)?;

    let mut skel = open_skel.load()?;
    skel.attach()?;

    println!(
        "Successfully started! Please run `sudo cat /sys/kernel/debug/tracing/trace_pipe` to see output of the BPF programs."
    );

    loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
```

The loader can be built and executed with `cargo run`.

```bash
$ cargo run
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.85s
     Running `target/debug/lsm`
libbpf: loading object 'lsm_bpf' from buffer
libbpf: elf: section(2) .symtab, size 480, link 1, flags 0, type=2
libbpf: elf: section(3) lsm/bprm_check_security, size 1824, link 0, flags 6, type=1
libbpf: sec 'lsm/bprm_check_security': found program 'handle_bprm_check_security' at insn offset 0 (0 bytes), code size 228 insns (1824 bytes)
...
Successfully started! Please run `sudo cat /sys/kernel/debug/tracing/trace_pipe` to see output of the BPF programs.
```

**Note:** eBPF verifier runs at the load-time, so at the moment the loader executable is invoked. Verification is not performed when building.

Now, when somebody attempts to run `/usr/bin/ls`:
```bash
$ ls
bash: /usr/bin/ls: Operation not permitted
```

Great! This proves LSM hook actually works and is capable of **synchronously** preventing execution of a given exectuable.
Asynchronous solutions might let malware run for a bit, giving it a short window to do some harm. 

However, the example is very limited and not scalable at all.
What if we want to block many executables?
Let's explore further.

# Step 2: Blocking multiple executables

A naive solution would be to create a pre-configured list of blacklisted executables stored inside a map.
Then in probe add a loop iterating over the list, comparing the strings, and returning `-EPERM` if a match found.
This however might not be the most optimal aproach in this specific scenario.

TODO

# Step 3: Bonus

TODO

# Summary

TODO
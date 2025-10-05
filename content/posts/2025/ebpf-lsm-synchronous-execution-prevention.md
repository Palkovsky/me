+++
date = '2025-10-05T18:44:36+02:00'
years = ['2025']
draft = false
title = 'eBPF + LSM: Synchronous Execution Prevention'
tags = []
+++

LSM (Linux Security Modules) hooks offer a way to synchronously stop certain actions from taking place on a Linux system.
This capability might, over the time, become used all over the place by various security products.
Let's explore a simple use-case scenario of blocking execution of certain executables.  

<!--more-->

## Environment

I'm using `Ubuntu 22.04` VM with a generic `5.15` kernel. 
The important bit is to ensure tha kernel was compiled with `CONFIG_BPF_LSM` and that grub boots it with eBPF for LSM turned on.

```bash
$ cat /boot/config-$(uname -r)  | grep CONFIG_BPF_LSM
CONFIG_BPF_LSM=y
$ cat /etc/default/grub | grep lsm
GRUB_CMDLINE_LINUX="lsm=lockdown,capability,landlock,yama,apparmor,bpf"
```

## Finding the right hook

Available hooks are stored within the `security_list_options` union:

```c
union security_list_options {
	#define LSM_HOOK(RET, DEFAULT, NAME, ...) RET (*NAME)(__VA_ARGS__);
	#include "lsm_hook_defs.h"
	#undef LSM_HOOK
	void *lsm_func_addr;
};
```

Actual definitions can be found in the [lsm_hooks_defs.h](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/include/linux/lsm_hook_defs.h):

```c
LSM_HOOK(int, 0, binder_set_context_mgr, const struct cred *mgr)
LSM_HOOK(int, 0, binder_transaction, const struct cred *from,
	 const struct cred *to)
LSM_HOOK(int, 0, binder_transfer_binder, const struct cred *from,
	 const struct cred *to)
...
```

The union holds a pointer to a hook function, macro expands to:

```c
union security_list_options {
	int (*binder_set_context_mgr)(const struct cred *);
	int (*binder_transaction)(const struct cred *, const struct cred *);
	int (*binder_transfer_binder)(const struct cred *, const struct cred *);
    ...
    void *lsm_func_addr;
}
```

### Capturing `execve`

Since the goal is to block execution of a given executable, we need to know which hook gets called on the `execve` syscall.
Grepping the definition list doesn't seem to lead to anything obvious (not a Linux kernel pro).
We need to look into the actual syscall call implementation.

As we walk [do_execve](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1928) -> [do_execveat_common](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1784) -> [bprm_execve](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1730) -> [exec_binprm](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1685) -> [search_binary_handler](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/fs/exec.c#L1651), we'll eventually find a call to `security_bprm_check`. 
The returned value short-circuts the system call, propagating the return value up to `do_execve`.

This is exactly what we desire - synchronous restrictions over a system call!

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

`security_bprm_check` itself is a beautifully documented function, calling the `bprm_check_security` that's also present in the [lsm_hooks_defs.h](https://github.com/torvalds/linux/blob/6093a688a07da07808f0122f9aa2a3eed250d853/include/linux/lsm_hook_defs.h).

This means we should be hooking the `bprm_check_security`:
```c
LSM_HOOK(int, 0, bprm_check_security, struct linux_binprm *bprm)
```

## PoC using the `bpftrace`

[bpftrace](https://github.com/bpftrace/bpftrace) can be used to validate if it's the right hook.
The tool uses custom naming for the probes, but we should be able to locate the right one with `grep`:

```bash
$ bpftrace -l | grep bprm_check_security
kfunc:bpf_lsm_bprm_check_security  <- Most likely
kprobe:bpf_lsm_bprm_check_security <- kfuncs prefered
```

`-v` can be used to examine the arguments:

```bash
$ bpftrace -vl kfunc:bpf_lsm_bprm_check_security
kfunc:bpf_lsm_bprm_check_security
    struct linux_binprm * bprm
    int retval
```

This sample program can prints out the `comm` identifier of the parent process and the `filename` of the executed image held inside the `bprm` (binary program) struct: 

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

This is nice, but it's just a regular "audit" probe - this can be done without LSM. 
Unfortunately, `bpftrace` doesn't support overriding a return value, as it focuses on observability rather than prevention.
We need to build a full-fledged eBPF program to get the prevention. 

## Setup

I'll be using [libbpf-rs](https://github.com/libbpf/libbpf-rs) to create a user-space loader for the eBPF application.


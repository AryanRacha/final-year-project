# WSL Command Execution Rule

Whenever executing terminal commands or scripts in this workspace on a Windows host:

1. **Always Target WSL Ubuntu**:
   All shell commands must run in the WSL Ubuntu Linux environment rather than the Windows PowerShell host.

2. **Command Format**:
   - Wrap Linux commands using `wsl.exe`:
     `wsl.exe --cd /home/aryan/coding/projects/final-year-project bash -c "command"`</br>
   - For subdirectories (e.g. `frontend` or `backend`):
     `wsl.exe --cd /home/aryan/coding/projects/final-year-project/frontend bash -c "command"`

3. **Working Directory (Cwd)**:
   - Use `wsl.exe \defaults and UNC workspace root for Cwd.

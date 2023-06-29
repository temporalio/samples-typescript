# Add version 1

```bash
./temporal task-queue update-build-ids add-new-default --task-queue versioned-queue --build-id "1.0"
```

# Start a couple

```bash
./temporal workflow start --task-queue versioned-queue --type versioningExample --workflow-id wf-1
./temporal workflow start --task-queue versioned-queue --type versioningExample --workflow-id wf-2
```

# Add version 2

```bash
./temporal task-queue update-build-ids add-new-default --task-queue versioned-queue --build-id "2.0"
```

# Start some more

```bash
./temporal workflow start --task-queue versioned-queue --type versioningExample --workflow-id wf-3
./temporal workflow start --task-queue versioned-queue --type versioningExample --workflow-id wf-4
```

# Add version 2.1

```bash
./temporal task-queue update-build-ids add-new-compatible --task-queue versioned-queue --build-id "2.1" --existing-compatible-build-id "2.0"
```

# Demonstrate reachability
```bash
./temporal task-queue get-build-id-reachability --task-queue versioned-queue --build-id "1.0" --build-id "2.0" --build-id "2.1"
```

### Usage

```yaml
name: check-version 

on:
  pull_request:
    branches:
      - master 

permissions:
  contents: write
  pull-requests: write

jobs:

  check-version:
    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - name: Check-version
        uses: o0th/action-check-version@v0.0.4
```

# Change Log

Prelude React Native SDK (Shared) Change Log

This package holds shared runtime code for the Prelude React Native SDKs. It is
published as a dependency of the public SDK packages and is not intended to be
installed directly.

## [0.1.1]

- Resolve optional numeric configuration (`timeout_milliseconds`,
  `max_retries`) to their defaults before crossing the native bridge; the
  legacy bridge rejects null numeric arguments.

## [0.1.0]

- Initial release. Shared API surface (`makeApi`, `Features`) and the web
  delegate backed by `@prelude.so/js-sdk`.

# Change Log

Prelude React Native SDK Change Log

## [0.5.2] - 2026-05-12

- Update native Android SDK to version 0.5.1, fixing a regression where signal dispatch could fail on Android when transport detection raced a 50ms timeout. iOS unchanged.

## [0.5.1] - 2026-04-21

- Update native iOS SDK to version 0.5.1. Fixes a build failure introduced in 0.5.0.

## [0.5.0] - 2026-04-17

- Update native Android SDK to version 0.5.0 and iOS SDK to version 0.5.0. These updates include improved Silent Network Authentication per carrier configuration, stronger device signals, and an improved signal dispatch algorithm.

## [0.4.0] - 2026-02-18

- Update native Android SDK to version 0.4.1 and iOS SDK to version 0.4.0. These updates include auto-retries during Silent Network Authentication redirection flow, optimized signals collection, and general performance improvements.

## [0.3.6] - 2026-01-29

- Update native Android SDK to version 0.3.0. It includes improvements in carrier-specific settings for SNA, native libraries handling and obfuscation settings.

## [0.3.5] - 2026-01-22

- Update native Android SDK to version 0.2.5. Adds network-bound DNS resolver for improved Silent Network Authentication (SNA) reliability.

## [0.3.4] - 2025-12-17
- Expose `max_retries` argument to allow for customizing the number of automatic retries for network requests
- Update native components to Android version 0.2.4 and iOS version 0.2.5. New defaults for timeouts and retries included
- Updated method documentation

## [0.3.3] - 2025-09-23

- Update native components to Android version 0.2.3 and iOS version 0.2.4 which added Silent Verification support for Bouygues

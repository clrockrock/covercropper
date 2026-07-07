# Security Policy

CoverCropper runs image operations in the browser and does not upload user images by itself.

## Reporting a vulnerability

Please report security issues privately through the repository security advisory flow or by contacting the maintainers listed in the npm package metadata.

## Notes for integrators

- Remote image export depends on browser canvas CORS rules.
- Do not pass untrusted URLs through a proxy without validating them server-side.

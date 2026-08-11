# Provider fallback

The runtime treats free public AI engines as interchangeable workers. It skips locally cooled providers, discovers current APIs, requires compatible inputs, rejects empty outputs, and moves to the next compatible worker after failure.

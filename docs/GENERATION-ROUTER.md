# Generation router

The router is capability-first. It does not promise that a named model or endpoint will remain available. It asks the current provider for its API schema, maps only compatible inputs, rejects empty results, and falls through to the next compatible free worker.

# Provider routing notes

The router does not assume a stable public endpoint. It requests all Gradio endpoint metadata and scores current compatible endpoints. If a Space changes its UI or API, the router can skip it and continue to another free worker instead of failing the whole Studio.

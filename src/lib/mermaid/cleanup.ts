/** Remove off-screen temporary nodes created by mermaid.render() for a given id. */
export function cleanupMermaidRenderElement(id: string) {
  // Only remove mermaid's hidden staging elements — not `id` itself, which is
  // assigned to the rendered <svg> once inserted into the preview container.
  for (const elementId of [`d${id}`, `dmermaid-${id}`]) {
    document.getElementById(elementId)?.remove()
  }
}

/** Remove leftover validation staging nodes from the document. */
export function cleanupMermaidValidationArtifacts() {
  for (const element of document.querySelectorAll('[id^="validate-"], [id^="dmermaid-validate-"]')) {
    element.remove()
  }
}

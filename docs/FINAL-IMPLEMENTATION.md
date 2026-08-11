# Final implementation

Provider cooldown state is integrated directly into the Gradio runner. Successful providers clear their cooldown; failures are backed off and skipped for subsequent requests until eligible again.

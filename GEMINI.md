# Gemini Deep Research Extension

This extension provides tools for performing Deep Research and managing File Search stores for Retrieval Augmented Generation (RAG).

## Available Tools

### File Search Management
- `file_search_create_store`: Create a new store for your documents.
- `file_search_list_stores`: See all your available stores.
- `file_search_upload_dir`: Upload all files from a local directory to a store.
- `file_search_delete_store`: Remove a store when it's no longer needed.

### Deep Research
- `research_start`: Start a background research task. You can ground it in your uploaded files by providing `fileSearchStoreNames`.
- `research_status`: Check if the research is done and see the results.
- `research_save_report`: Once completed, save the findings as a professional Markdown report.

## Instructions
When the user asks you to "research" something or "look into" their files, follow these steps:
1. If research requires specific files, ensure they are uploaded to a `fileSearchStore`. Use `file_search_list_stores` to check for existing stores or `file_search_create_store` and `file_search_upload_dir` to add new ones.
2. Use `research_start` with the appropriate `fileSearchStoreNames` if grounding is needed.
3. Inform the user the research has started and provide the ID.
4. You can periodically check the status with `research_status` if the user stays in the session, or let the user know they can check later.
5. Once research is completed, offer to save it as a Markdown report using `research_save_report`.

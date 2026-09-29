// SplatStudio desktop shell.
//
// A thin native window over the local daemon (which serves the web UI). The
// window loads `src/index.html`, which forwards to the daemon URL — see
// README.md. No application logic lives here.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running SplatStudio desktop");
}

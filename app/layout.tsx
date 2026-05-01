"use client";

import { Provider } from "react-redux";
import { store } from "../src/store/store";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell">
        <Provider store={store}>
          <div className="page-frame">{children}</div>
        </Provider>
      </body>
    </html>
  );
}

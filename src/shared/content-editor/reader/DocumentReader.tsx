"use client";

import React from "react";
import {
  DocumentPreviewContainer,
  type DocumentPreviewContainerProps,
} from "../renderer/DocumentPreviewContainer";

export type DocumentReaderProps = DocumentPreviewContainerProps;

/**
 * Pure Read-Only Article Reader View.
 * Displays content exactly as shown on the public site without block borders or editing controls.
 * Supports Desktop, Tablet, and Mobile viewports.
 */
export function DocumentReader(props: DocumentReaderProps) {
  return <DocumentPreviewContainer {...props} />;
}

export { DocumentPreviewContainer };

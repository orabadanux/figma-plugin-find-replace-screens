// code.ts
/// <reference types="@figma/plugin-typings" />

// Show UI with specified dimensions
figma.showUI(__html__, { width: 420, height: 280 });

// Send frame names when the plugin starts
function getScreenFrames() {
  // Get only direct children of the page that are frames
  const topLevelFrames = figma.currentPage.children.filter(
    (node): node is FrameNode => node.type === 'FRAME'
  );
  
  // Get unique names
  const uniqueNames = Array.from(new Set(
    topLevelFrames.map(frame => frame.name)
  )).sort();
  
  return uniqueNames;
}

// Send frame names when the plugin starts
function sendFrameNames() {
  const screenNames = getScreenFrames();
  console.log("Plugin: Sending screen names:", screenNames);
  
  figma.ui.postMessage({
    type: 'populate-frames',
    frameNames: screenNames
  });
}

sendFrameNames();

// Listen for messages from UI
figma.ui.onmessage = (msg) => {
  console.log("Plugin received message:", msg);

  if (msg.type === 'synchronize-frames') {
    const sourceName = msg.sourceName;
    const targetName = msg.targetName;
    
    console.log("Processing synchronization:", { sourceName, targetName });

    try {
      if (!sourceName || !targetName) {
        figma.notify('Both frame names are required');
        return;
      }

      // Find only top-level frames
      const topLevelFrames = figma.currentPage.children.filter(
        (node): node is FrameNode => node.type === 'FRAME'
      );

      // Find source frame from top-level frames
      const sourceFrame = topLevelFrames.find(frame => frame.name === sourceName);
      if (!sourceFrame) {
        figma.notify(`No top-level frame found with name "${sourceName}"`);
        return;
      }

      // Find target frames from top-level frames
      const targetFrames = topLevelFrames.filter(frame => frame.name === targetName);
      if (targetFrames.length === 0) {
        figma.notify(`No top-level frames found with name "${targetName}"`);
        return;
      }

      // Perform replacement
      for (const frame of targetFrames) {
        // Skip if it's the same frame
        if (frame.id === sourceFrame.id) continue;

        // Clear existing children
        for (const child of [...frame.children]) {
          child.remove();
        }

        // Clone children from source frame
        for (const child of sourceFrame.children) {
          frame.appendChild(child.clone());
        }

        // Copy properties
        applyProperties(sourceFrame, frame);
      }

      figma.notify(`Successfully replaced ${targetFrames.length} frame(s)`);
      figma.closePlugin();

    } catch (error) {
      console.error("Error during frame synchronization:", error);
      figma.notify(error instanceof Error ? error.message : 'An error occurred');
    }
  }
};

function applyProperties(source: FrameNode, target: FrameNode) {
  target.layoutMode = source.layoutMode;
  target.primaryAxisSizingMode = source.primaryAxisSizingMode;
  target.counterAxisSizingMode = source.counterAxisSizingMode;
  target.primaryAxisAlignItems = source.primaryAxisAlignItems;
  target.counterAxisAlignItems = source.counterAxisAlignItems;
  target.paddingLeft = source.paddingLeft;
  target.paddingRight = source.paddingRight;
  target.paddingTop = source.paddingTop;
  target.paddingBottom = source.paddingBottom;
  target.itemSpacing = source.itemSpacing;
  target.resizeWithoutConstraints(source.width, source.height);
  target.fills = source.fills;
  target.strokes = source.strokes;
  target.effects = source.effects;
  target.cornerRadius = source.cornerRadius;
  target.opacity = source.opacity;
  target.rotation = source.rotation;
  target.constraints = source.constraints;
}
// code.ts
/// <reference types="@figma/plugin-typings" />

// Show the UI with a specified width and height
figma.showUI(__html__, { width: 420, height: 280 });

/**
 * Retrieves all top-level frames on the current Figma page,
 * removes duplicates by name, and returns a sorted list of unique frame names.
 */
function getScreenFrames() {
  const topLevelFrames = figma.currentPage.children.filter(
    (node): node is FrameNode => node.type === 'FRAME'
  );

  // Extract unique names and sort them alphabetically
  const uniqueNames = Array.from(new Set(
    topLevelFrames.map(frame => frame.name)
  )).sort();

  return uniqueNames;
}

/**
 * Sends the list of unique frame names to the UI for display.
 */
function sendFrameNames() {
  const screenNames = getScreenFrames();

  // Post the frame names to the UI
  figma.ui.postMessage({
    type: 'populate-frames',
    frameNames: screenNames
  });
}

// Initial sending of frame names when the plugin starts
sendFrameNames();

/**
 * Handles messages sent from the UI.
 */
figma.ui.onmessage = (msg) => {

  if (msg.type === 'synchronize-frames') {
    const sourceName = msg.sourceName;
    const targetName = msg.targetName;


    try {
      if (!sourceName || !targetName) {
        figma.notify('Both frame names are required');
        return;
      }

      // Retrieve all top-level frames on the current page
      const topLevelFrames = figma.currentPage.children.filter(
        (node): node is FrameNode => node.type === 'FRAME'
      );

      // Find the source frame
      const sourceFrame = topLevelFrames.find(frame => frame.name === sourceName);
      if (!sourceFrame) {
        figma.notify(`No top-level frame found with name "${sourceName}"`);
        return;
      }

      // Find all target frames with the specified name
      const targetFrames = topLevelFrames.filter(frame => frame.name === targetName);
      if (targetFrames.length === 0) {
        figma.notify(`No top-level frames found with name "${targetName}"`);
        return;
      }

      // Replace the content of each target frame with the source frame's content
      for (const frame of targetFrames) {
        if (frame.id === sourceFrame.id) continue;

        // Remove all children from the target frame
        for (const child of [...frame.children]) {
          child.remove();
        }

        // Clone and append children from the source frame
        for (const child of sourceFrame.children) {
          frame.appendChild(child.clone());
        }

        // Apply the properties of the source frame to the target frame
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

/**
 * Copies the visual and layout properties from the source frame to the target frame.
 */
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
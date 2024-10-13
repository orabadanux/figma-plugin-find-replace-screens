/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, { width: 420, height: 320 });

const allFrames = figma.currentPage.findAll((node) => node.type === 'FRAME') as FrameNode[];

const screenFrames = allFrames.filter((frame) => frame.parent === figma.currentPage);

const frameNames = screenFrames.map((frame) => frame.name);

figma.ui.postMessage({
  type: 'populate-frames',
  frameNames: frameNames
});

figma.ui.onmessage = async (msg) => {

  if (msg.type === 'synchronize-frames') {
    const { sourceName, targetName } = msg;

    await synchronizeFrames(sourceName, targetName);
    figma.closePlugin('Screens replaced successfully!');
  }
};


async function synchronizeFrames(sourceName: string, targetName: string) {


  const sourceFrames = figma.currentPage.findAll(
    (node) => node.type === 'FRAME' && node.name === sourceName
  ) as FrameNode[];


  if (sourceFrames.length === 0) {
    figma.notify(`No screens found with the name "${sourceName}".`);
    return;
  }


  const targetFrames = figma.currentPage.findAll(
    (node) => node.type === 'FRAME' && node.name === targetName
  ) as FrameNode[];

  if (targetFrames.length === 0) {
    figma.notify(`No screens found with the name "${targetName}".`);
    return;
  }

  const sourceFrame = sourceFrames[0];

  targetFrames.forEach((targetFrame) => {

    while (targetFrame.children.length > 0) {
      targetFrame.children[0].remove();
    }

    for (const child of sourceFrame.children) {
      const clonedChild = child.clone();
      targetFrame.appendChild(clonedChild);
    }

  });

  figma.notify(`Screens replaced successfully!`);
}



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

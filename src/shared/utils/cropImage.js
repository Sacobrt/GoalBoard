export async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    // Set canvas dimensions to the crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image onto the canvas
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

    // Return as a base64 data URL with scaled down size (to max 200x200 if it is too big)
    // we want to constrain it so we don't blow up localStorage.
    const maxSide = 200;
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    if (finalWidth > maxSide || finalHeight > maxSide) {
        const ratio = Math.min(maxSide / finalWidth, maxSide / finalHeight);
        finalWidth = Math.round(finalWidth * ratio);
        finalHeight = Math.round(finalHeight * ratio);

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;
        const finalCtx = finalCanvas.getContext("2d");

        finalCtx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, finalWidth, finalHeight);
        return finalCanvas.toDataURL("image/jpeg", 0.85);
    }

    return canvas.toDataURL("image/jpeg", 0.85);
}

function createImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        // Needed to avoid CORS issues if loading image from another domain
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });
}

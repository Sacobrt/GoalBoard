import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Upload, Trash2, Camera } from "lucide-react";
import { Button } from "../../components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../../components/ui/dialog";
import { getCroppedImg } from "../utils/cropImage";

// We can accept image types, but we'll still enforce a max size roughly, but the downscaling
// happening in cropImage will make base64 small enough for localStorage.
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUploader({ user, onAvatarChange }) {
    const storageKey = `goalboard_avatar_${user?.id}`;
    const [avatar, setAvatar] = useState(() => localStorage.getItem(storageKey));
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    // Cropping state
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Please upload a JPG, PNG, WebP, or GIF image.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setImageSrc(ev.target?.result);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input so selecting the same file again triggers onChange
        e.target.value = "";
    }

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    async function handleSaveCrop() {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedDataUrl) {
                localStorage.setItem(storageKey, croppedDataUrl);
                setAvatar(croppedDataUrl);
                // Dispatch event so other components (Header, Sidebar) update instantly
                window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { userId: user.id } }));
                onAvatarChange?.();
            }
            setIsCropModalOpen(false);
        } catch (err) {
            console.error("Failed to crop image:", err);
            setError("Failed to process image.");
        } finally {
            setIsProcessing(false);
        }
    }

    function handleRemove() {
        localStorage.removeItem(storageKey);
        setAvatar(null);
        setError("");
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { userId: user.id } }));
        onAvatarChange?.();
    }

    return (
        <div className="flex items-center gap-5">
            <div className="relative group">
                <UserAvatar user={user} size="xl" />
                <button
                    onClick={() => inputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                    title="Change Avatar"
                >
                    <Camera className="h-6 w-6 text-white" />
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" />
                        {avatar ? "Change" : "Upload"}
                    </Button>
                    {avatar && (
                        <Button size="sm" variant="ghost" onClick={handleRemove} className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF</p>
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} onChange={handleFileSelect} className="hidden" />

            {/* Crop Modal */}
            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Crop Profile Photo</DialogTitle>
                    </DialogHeader>

                    <div className="relative h-64 w-full rounded-md overflow-hidden bg-black/5 mt-4">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div className="mt-4 px-2">
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">Zoom</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isProcessing}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button onClick={handleSaveCrop} disabled={isProcessing}>
                            {isProcessing ? "Saving..." : "Save Image"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

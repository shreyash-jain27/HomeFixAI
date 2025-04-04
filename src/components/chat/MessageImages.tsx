
import React from "react";

interface MessageImagesProps {
  images: string[];
}

const MessageImages = ({ images }: MessageImagesProps) => {
  if (!images || images.length === 0) return null;
  
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((image, index) => (
        <img 
          key={index}
          src={image}
          alt={`Uploaded image ${index + 1}`}
          className="max-w-[200px] max-h-[200px] object-contain rounded-md border"
        />
      ))}
    </div>
  );
};

export default MessageImages;

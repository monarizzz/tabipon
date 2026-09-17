import { CameraMain } from "@/src/features/camera/components/CameraMain/CameraMain";
import { useCamera } from "@/src/features/camera/hooks/useCamera";

export default function CameraScreen() {
  return <CameraMain {...useCamera()} />;
}

import * as ImagePicker from "expo-image-picker";

/**
 * Spread into every `launchImageLibraryAsync` call.
 *
 * iPhones with "High Efficiency" enabled store photos as HEIC, which only
 * Safari can decode. The picker's default `preferredAssetRepresentationMode`
 * is `Automatic`, and the system generally hands back the *current*
 * representation to avoid the cost of transcoding — so the app receives raw
 * HEIC bytes. Those then get uploaded as `image/jpeg` under a `.jpg` name
 * (see listingsService.uploadPhoto), and the resulting image renders nowhere
 * except Safari — listings showed the PropertyLoop banner instead of photos.
 *
 * `Compatible` makes iOS transcode to JPEG while loading the asset, so the
 * bytes match the label we upload them under. No-op on Android, which does not
 * produce HEIC through this picker.
 *
 * The API converts any HEIC that still reaches it, but doing it here keeps the
 * upload honest and avoids a multi-second server-side decode per image.
 */
export const compatibleImageAssets = {
  preferredAssetRepresentationMode:
    ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
} as const;

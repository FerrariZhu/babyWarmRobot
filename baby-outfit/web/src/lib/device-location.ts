/** 浏览器 Geolocation API（需 HTTPS 或 localhost） */

export class DeviceLocationError extends Error {
  code: "unsupported" | "denied" | "unavailable" | "timeout" | "unknown";

  constructor(
    code: DeviceLocationError["code"],
    message: string
  ) {
    super(message);
    this.name = "DeviceLocationError";
    this.code = code;
  }
}

export interface DeviceCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 5 * 60_000,
};

export function getDeviceLocation(
  options: PositionOptions = DEFAULT_OPTIONS
): Promise<DeviceCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new DeviceLocationError("unsupported", "当前浏览器不支持定位"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new DeviceLocationError("denied", "定位权限被拒绝，请在浏览器设置中允许访问位置"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(
              new DeviceLocationError("unavailable", "无法获取当前位置，请检查设备定位是否开启")
            );
            break;
          case error.TIMEOUT:
            reject(new DeviceLocationError("timeout", "定位超时，请稍后重试"));
            break;
          default:
            reject(new DeviceLocationError("unknown", "定位失败，请稍后重试"));
        }
      },
      options
    );
  });
}

import { MaterialIcon } from "./material-icon";
import { weatherIcon } from "@/lib/stitch-utils";

export function WeatherWidget({
  city,
  weather,
}: {
  city?: string | null;
  weather: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    text: string;
    precipProbability?: number;
    uvIndex?: number;
  };
}) {
  const windKmh = Math.round(weather.windSpeed * 3.6);
  const realFeel =
    weather.feelsLike < weather.temp - 2
      ? "添加一件轻便内搭，体感比实际温度更凉。"
      : weather.feelsLike > weather.temp + 2
        ? "选择透气面料，体感比温度计显示更暖。"
        : weather.windSpeed > 4
          ? "添加一件轻便的棉质内搭以抵御微风。"
          : weather.precipProbability != null && weather.precipProbability > 50
            ? "降水概率较高，外出记得加防水外层。"
            : "今日温湿度组合较为舒适，按推荐搭配即可。";

  const locationLabel = city ? `今日${city}` : "今日天气";

  return (
    <section className="relative flex flex-col items-center overflow-hidden rounded-[2rem] bg-primary-fixed p-6 text-center cloud-shadow">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary-fixed-dim opacity-50 blur-xl" />
      <h2 className="font-body-md mb-1 text-on-primary-fixed">{locationLabel}</h2>
      <p className="font-label-caps mb-3 text-on-primary-fixed-variant">{weather.text}</p>
      <div className="mb-4 flex items-center justify-center gap-4">
        <MaterialIcon
          name={weatherIcon(weather.text)}
          filled
          className="text-[64px] text-primary"
        />
        <div className="flex flex-col items-start">
          <span className="font-display-lg-mobile text-on-primary-fixed">
            {Math.round(weather.temp)}°C
          </span>
          <span className="font-label-caps text-on-primary-fixed-variant">
            体感 {Math.round(weather.feelsLike)}°C
          </span>
        </div>
      </div>
      <div className="font-label-caps mb-6 flex flex-wrap justify-center gap-4 text-on-primary-fixed-variant">
        <div className="flex items-center gap-1">
          <MaterialIcon name="air" className="text-[16px]" />
          <span>{windKmh} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <MaterialIcon name="humidity_percentage" className="text-[16px]" />
          <span>{weather.humidity}%</span>
        </div>
        {weather.precipProbability != null && (
          <div className="flex items-center gap-1">
            <MaterialIcon name="rainy" className="text-[16px]" />
            <span>降水 {Math.round(weather.precipProbability)}%</span>
          </div>
        )}
      </div>
      <div className="w-full max-w-sm rounded-xl border border-white/50 bg-surface-container-lowest/80 px-4 py-3 backdrop-blur-sm">
        <p className="font-body-md text-on-primary-container">
          <strong>体感穿搭建议：</strong> {realFeel}
        </p>
      </div>
    </section>
  );
}

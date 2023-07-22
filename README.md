# 子弹图组件

支持自定义配置柱子/标线的颜色、宽度，分割的段数，气泡的UI、位置；刻度配置支持自定义刻度文案单位转换、正负数、0刻度居中等效果。

效果展示：
![demonstration](https://github.com/skystar-chen/public-product_bullet-chart-react/blob/main/assets/images/demonstration.gif)

> 作者：陈星~

## 一、安装

```shell
npm i bullet-chart-react -S
```

或

```shell
yarn add bullet-chart-react
```

## 二、使用

```react
import BulletChart from 'bullet-chart-react'
```

## 三、参数注解及默认值

```typescript
参数含义：
type IOpt = {
  color?: string,
  barWidth?: number,
  value?: string | number,
};
interface BulletChartPropsType {
  className?: string,
  style?: React.CSSProperties,
  tooltipClassName?: string,
  tooltipStyle?: React.CSSProperties,
  // 刻度分割的段数
  splitCount?: number,
  // 柱子的宽度、颜色没有变化的话只传value就行了
  option: {
    'bgBar'?: IOpt,
    'mainBar'?: IOpt,
    'markLine'?: IOpt,
  },
  // 转换数值成K/M/B/T的方法，用于转换刻度
  formatNumber?: {
    func: Function | null, // 方法体
    // 方法中涉及的参数，其中参数为“_entranceValue”的将视为要转换的值传入的参数位置
    // 不传的话要转换的值将默认放在第一参数的位置传入
    params?: any[],
  } | null,
  minPercentage?: number, // 柱子最小占的百分之几
  tooltipData: any,
  tooltipFormatter?: ((data: any) => (JSX.Element | (any & {}))) | null,
  // 水平方向hover的位置超过容器一半时是否浮窗在鼠标的左右位置变化
  isTooltipHalfAdaptPosition?: boolean,
  // 刻度是否保留整数
  isLabelKeepInteger?: boolean,
  // 0刻度是否固定居中（可以根据数据的情况动态控制），是的话分割的段数会向上取偶数
  isCenterZeroLabel?: boolean,
}
对应默认值：
BulletChart.defaultProps = {
  className: '',
  style: {},
  tooltipClassName: '',
  tooltipStyle: {},
  splitCount: 5,
  option: {},
  formatNumber: null,
  minPercentage: 0.5,
  tooltipData: null,
  tooltipFormatter: null,
  isTooltipHalfAdaptPosition: false,
  isLabelKeepInteger: true,
  isCenterZeroLabel: false,
};
```

## 四、更新日志

### ↪1.0.1

`2023-07-22`

☆ 去除gif图占用包体积。

### ↪1.0.0

`2023-07-22`

☆ 首次发布。

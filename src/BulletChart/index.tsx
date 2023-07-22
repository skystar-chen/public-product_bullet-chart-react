import { memo, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useThrottleState from './hooks/useThrottleState';
import {
  getSuitMaxNumber,
  getFormatNumberRes,
  // defaultTooltipFormatter,
  SYMBOL_ARR,
} from './utils';
import './index.scss';

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

const DEFAULT_PROPS: BulletChartPropsType = {
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

function BulletChart(props: BulletChartPropsType) {

  const {
    className,
    style,
    tooltipClassName,
    tooltipStyle,
    splitCount: propsSplitCount,
    option,
    formatNumber,
    minPercentage,
    tooltipData,
    tooltipFormatter,
    isTooltipHalfAdaptPosition,
    isLabelKeepInteger,
    isCenterZeroLabel,
  } = props;

  // 浮窗容器是否准备好
  const [readyTipBox, setReadyTipBox] = useState<boolean>(false);
  // 负数占比
  const [negativePercentage, setNegativePercentage] = useState<number>(0);
  // 是否全为负数
  const [isAllNegative, setIsAllNegative] = useState<boolean>(false);
  const [visibleTooltip, setVisibleTooltip] = useState<boolean>(false);
  const [pointerX, setPointerX] = useState<number>(0);
  const [pointerY, setPointerY] = useState<number>(0);
  const throttledPointerX = useThrottleState({
    state: pointerX,
    options: {
      wait: 50,
    },
  });
  const throttledPointerY = useThrottleState({
    state: pointerY,
    options: {
      wait: 50,
    },
  });
  const [containerPaddingLeft, setContainerPaddingLeft] = useState<number>(0);
  const [containerPaddingRight, setContainerPaddingRight] = useState<number>(0);
  const [left, setLeft] = useState<number | string>(0);
  const [top, setTop] = useState<number | string>(0);
  const xAxisBoxRef = useRef<HTMLUListElement>(null);
  const chartAreaRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLElement>(null);

  // 0刻度要求在中间时，分割段数是奇数的话+1
  const splitCount: number = useMemo(() => {
    if (isCenterZeroLabel) {
      return ((propsSplitCount as number) % 2 === 0) ? (propsSplitCount as number) : (propsSplitCount as number) + 1;
    } else {
      return propsSplitCount || 5;
    }
  }, [
    propsSplitCount,
    isCenterZeroLabel,
    negativePercentage,
    isAllNegative,
  ]);

  // 计算出合理的最大值
  const max = useMemo(() => {
    const a = String(option?.bgBar?.value),
          b = String(option?.mainBar?.value),
          c = String(option?.markLine?.value);
    const strArr = [a, b, c],
          numArr = [Number(a) || 0, Number(b) || 0, Number(c) || 0];
    let tempMax = Math?.max(...numArr);
    // 刚开始这个最大值是否是负数
    const isNegativeInitTempMax = String(tempMax)?.includes('-');
    // 有负数的情况
    let absMinimumV = 0;
    if (strArr?.join('')?.includes('-')) {
      let minimumV = 0;
      for(let i = 0; i < numArr?.length; i ++) {
        const t = numArr?.[i];
        minimumV = t < minimumV ? t : minimumV;
      }
      absMinimumV = Math?.abs(minimumV);
      const isAllNegative = isNegativeInitTempMax || tempMax === 0;
      setIsAllNegative(isAllNegative);
      tempMax = isCenterZeroLabel
        ? tempMax >= absMinimumV ? tempMax * 2 : absMinimumV * 2
        : isAllNegative ? absMinimumV : (tempMax + absMinimumV);
    } else if (isCenterZeroLabel) {
      tempMax *= 2;
    }
    // 数据扩大进行计算，因为正负数两个方向都可能各向上取值各扩大一个刻度，有负数时扩大两个刻度，没有负数时扩大一个刻度
    const expansionToRatio = (isCenterZeroLabel || (absMinimumV && !isNegativeInitTempMax))
      ? (1 + (1 / splitCount) * 2)
      : (1 + 1 / splitCount);
    const res = getSuitMaxNumber(
      tempMax * expansionToRatio,
      splitCount,
      true,
      formatNumber,
    );
    // 负数占的比例
    absMinimumV && setNegativePercentage(absMinimumV / res);

    return res;
  }, [
    splitCount,
    isCenterZeroLabel,
    option?.bgBar?.value,
    option?.mainBar?.value,
    option?.markLine?.value,
    formatNumber?.func,
    formatNumber?.params,
  ]);

  // 0刻度的位置，从1开始
  const zeroLabelPosition = useMemo(() => {
    /* switch (true) {
      case negativePercentage >= 0.8:
        return 6;

      case negativePercentage >= 0.6:
        return 5;

      case negativePercentage >= 0.4:
        return 4;

      case negativePercentage >= 0.2:
        return 3;

      case negativePercentage > 0:
        return 2;
    
      default:
        return 1;
    } */
    if (isCenterZeroLabel) {
      return Math.ceil(splitCount / 2) + 1;
    }
    let position = -1;
    if (negativePercentage === 0) {
      position = 1;
    } else if (negativePercentage > 0 && negativePercentage < (1 / splitCount)) {
      position = 2;
    } else if (negativePercentage === 1) {
      position = splitCount + 1;
    } else {
      position = isAllNegative ? (splitCount + 1) : (2 + Math?.floor(negativePercentage / (1 / splitCount)));
    }

    return position > 0 ? position : 1;
  }, [negativePercentage, splitCount, isCenterZeroLabel, isAllNegative]);

  // 刻度文案
  const xAxisLabels = useMemo(() => {
    const res: string[] = [];
    // 刻度之间的间距（去整数部分去除单位）
    let interval = getFormatNumberRes(formatNumber, max / splitCount)?.split('.')?.[0];
    // 如果转换单位后本身就是整数并且带单位
    if (SYMBOL_ARR?.includes(interval.slice(-1))) {
      interval = interval.slice(0, -1);
    }
    const maxFormatV = getFormatNumberRes(formatNumber, max);
    // 最大值转换后单位
    const unit = maxFormatV?.slice(-1);
    // 是否有单位
    const isUnit = SYMBOL_ARR?.includes(unit);
    // 小数据后0的个数
    const zeroCount = maxFormatV?.split('.')?.[1]?.length - (isUnit ? 1 : 0);
    for(let i = 0; i <= splitCount; i ++) {
      const labelNum = max * i / splitCount;
      let labelText: string | number = getFormatNumberRes(formatNumber, labelNum);
      labelText = isLabelKeepInteger ? labelText?.split('.')?.[0] : (isUnit ? labelText?.slice(0, -1) : labelText);
      // 如果转换单位后本身就是整数并且带单位
      if (SYMBOL_ARR?.includes(labelText.slice(-1))) {
        labelText = labelText.slice(0, -1);
      }
      // 如果有负数
      if (zeroLabelPosition > 1) {
        labelText = Number(labelText) - Number(interval) * (zeroLabelPosition - 1);
        if (!isLabelKeepInteger && zeroCount > 0) {
          // 补0
          labelText = String(labelText) + '.' + String(Math.pow(10, zeroCount)).slice(1);
        }
      }
      // 有单位加上单位
      if (isUnit && Number(labelText) !== 0) {
        labelText = labelText + unit;
      }
      res.push(String(Number(labelText) === 0 ? '0' : labelText));
    }

    return res;
  }, [
    max,
    zeroLabelPosition,
    isLabelKeepInteger,
    splitCount,
    formatNumber?.func,
    formatNumber?.params,
  ]);

  // 柱子的配置
  const chartOption = useMemo(() => {
    return {
      'bgBar': {
        color: option?.bgBar?.color || '#D4E8FF',
        barWidth: option?.bgBar?.barWidth || 44,
        value: Number(option?.bgBar?.value) || 0,
      },
      'mainBar': {
        color: option?.mainBar?.color || '#5086F3',
        barWidth: option?.mainBar?.barWidth || 24,
        value: Number(option?.mainBar?.value) || 0,
      },
      'markLine': {
        color: option?.markLine?.color || '#6A7597',
        barWidth: option?.markLine?.barWidth || 44,
        value: Number(option?.markLine?.value) || 0,
      },
    };
  }, [option]);

  // 浮窗是否出现在鼠标左侧
  const isTooltipLeftPointer = useMemo(() => {
    if (!isTooltipHalfAdaptPosition) return false;
    const chartAreaCenterPointerX = (chartAreaRef?.current?.getBoundingClientRect()?.left || 0) + ((chartAreaRef?.current?.clientWidth || 0) / 2);

    return pointerX > chartAreaCenterPointerX;
  }, [isTooltipHalfAdaptPosition, throttledPointerX, throttledPointerY]);

  // 柱子的宽度及left占的百分比
  const {
    bgBar,
    mainBar,
    markLine,
  } = useMemo(() => {
    const res = {
      bgBar: {
        widthPercent: 0,
        left: 0,
      },
      mainBar: {
        widthPercent: 0,
        left: 0,
      },
      markLine: {
        widthPercent: 0,
        left: 0,
      },
    };

    if (max > 0) {
      const absBgBarV = Math?.abs(chartOption?.bgBar?.value) || 0,
            absMainBarV = Math?.abs(chartOption?.mainBar?.value) || 0,
            absMarkLineV = Math?.abs(chartOption?.markLine?.value) || 0,
            bgBarUnit = chartOption?.bgBar?.value < 0 ? '-' : '',
            mainBarUnit = chartOption?.mainBar?.value < 0 ? '-' : '',
            markLineUnit = chartOption?.markLine?.value < 0 ? '-' : '';
      const bgBarWidthPercent = Math?.round((absBgBarV / max) * 10000) / 100,
            mainBarWidthPercent = Math?.round((absMainBarV / max) * 10000) / 100,
            markLineWidthPercent = Math?.round((absMarkLineV / max) * 10000) / 100;
  
      const intervalPercent = 100 / splitCount; // 每段占的百分比
      const zeroMovePercent = (zeroLabelPosition - 1) * intervalPercent; // 零刻度移动的百分比
      res.bgBar.widthPercent = bgBarWidthPercent < (minPercentage as number) ? (minPercentage as number) : bgBarWidthPercent;
      res.mainBar.widthPercent = mainBarWidthPercent < (minPercentage as number) ? (minPercentage as number) : mainBarWidthPercent;
      res.markLine.widthPercent = markLineWidthPercent < (minPercentage as number) ? (minPercentage as number) : markLineWidthPercent;
      // 有负数的情况
      if (zeroLabelPosition > 1) {
        res.bgBar.left = bgBarUnit ? zeroMovePercent - res.bgBar.widthPercent : zeroMovePercent;
        res.mainBar.left = mainBarUnit ? zeroMovePercent - res.mainBar.widthPercent : zeroMovePercent;
        res.markLine.left = markLineUnit ? zeroMovePercent - res.markLine.widthPercent : zeroMovePercent + res.markLine.widthPercent;
      } else {
        res.markLine.left = res.markLine.widthPercent;
      }
    }

    return res;
  }, [
    max,
    splitCount,
    zeroLabelPosition,
    minPercentage,
    chartOption?.bgBar?.value,
    chartOption?.mainBar?.value,
    chartOption?.markLine?.value,
  ]);

  const handleMouseEnter = useCallback((e) => {
    setVisibleTooltip(true);
    setPointerX(e?.clientX || 0);
    setPointerY(e?.clientY || 0);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    setVisibleTooltip(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    setPointerX(e?.clientX || 0);
    setPointerY(e?.clientY || 0);
  }, []);

  // 计算浮窗的位置
  useEffect(() => {
    if (visibleTooltip) {
      setLeft(isTooltipLeftPointer ? pointerX - 30 - (tooltipRef?.current?.clientWidth || 0) : pointerX + 30);
      setTop(pointerY - (tooltipRef?.current?.clientHeight || 0) / 2);
    } else {
      // 初始默认位置放到屏幕中间
      left || setLeft(`calc(50% - ${(tooltipRef?.current?.clientWidth || 0) / 2}px)`);
      top || setTop(`calc(50% - ${(tooltipRef?.current?.clientHeight || 0) / 2}px)`);
    }
  }, [
    visibleTooltip,
    isTooltipLeftPointer,
    throttledPointerX,
    throttledPointerY,
  ]);

  // 气泡容器添加到body最后
  useEffect(() => {
    const bubbleTipContainerEl = document.querySelector('.bullet-chart-bubble-tip-container');
    if (!bubbleTipContainerEl) {
      const newBubbleTipContainerEl = document.createElement('section');
      newBubbleTipContainerEl.className = 'bullet-chart-bubble-tip-container';
      document.body.appendChild(newBubbleTipContainerEl);
    }
    setReadyTipBox(true);
  }, []);

  // 设置第一个刻度文案
  useEffect(() => {
    if (xAxisBoxRef?.current) {
      xAxisBoxRef?.current?.setAttribute('data-bullet-chart-x-axis-after', xAxisLabels?.[0] || '-');
    }
  }, [xAxisLabels?.[0]]);

  // 因为刻度文案是居中对齐刻度的，第一个刻度左边及最后一个刻度右边的距离计算出来，给容器加这个padding
  useEffect(() => {
    const firstLabel = xAxisLabels?.[0] || '-', lastLabel = xAxisLabels?.[xAxisLabels?.length - 1] || '-';
    const li = document.createElement('li');
    li.className = 'bullet-chart-x-axis-item';
    li.style.cssText = 'position:absolute;visibility:hidden;';
    const span = document.createElement('span');
    span.className = 'bullet-chart-x-axis-item-label';
    span.style.cssText = 'position:absolute;visibility:hidden;';
    /* const {
      firstLabelWidth = 0,
      lastLabelWidth = 0,
    } = await ((): Promise<{firstLabelWidth: number, lastLabelWidth: number}> => (new Promise((resolve, reject) => {
      const t = setInterval(() => {
        if (xAxisBoxRef?.current) {
          span.innerHTML = firstLabel;
          li.appendChild(span);
          xAxisBoxRef.current.appendChild(li);
          const firstLabelWidth = span.offsetWidth || 0;
          span.innerHTML = lastLabel;
          const lastLabelWidth = span.offsetWidth || 0;
          li.removeChild(span);
          xAxisBoxRef.current.removeChild(li);
          resolve({
            firstLabelWidth,
            lastLabelWidth,
          });
          clearInterval(t);
        }
      }, 100);
    })))(); */
    const t = setInterval(() => {
      if (xAxisBoxRef?.current) {
        span.innerHTML = firstLabel;
        li.appendChild(span);
        xAxisBoxRef.current.appendChild(li);
        const firstLabelWidth = span.offsetWidth || 0;
        setContainerPaddingLeft(firstLabelWidth / 2);
        span.innerHTML = lastLabel;
        const lastLabelWidth = span.offsetWidth || 0;
        setContainerPaddingRight(lastLabelWidth / 2);
        li.removeChild(span);
        xAxisBoxRef.current.removeChild(li);
        clearInterval(t);
      }
    }, 100);
  }, [xAxisLabels?.[0], xAxisLabels?.[xAxisLabels?.length - 1]]);

  return (
    <section
      className={`bullet-chart ${className}`}
      style={{
        ...style,
        padding: `0 ${containerPaddingRight}px 0 ${containerPaddingLeft}px`,
      }}
    >
      <section
        ref={chartAreaRef}
        className="bullet-chart-body"
        style={{height: chartOption?.bgBar?.barWidth}}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <section
          className="bullet-chart-bg-bar"
          style={{
            backgroundColor: chartOption?.bgBar?.color,
            width: `${bgBar?.widthPercent}%`,
            left: `${bgBar?.left}%`,
            height: chartOption?.bgBar?.barWidth,
          }}
        ></section>
        <section
          className="bullet-chart-main-bar"
          style={{
            backgroundColor: chartOption?.mainBar?.color,
            width: `${mainBar.widthPercent}%`,
            left: `${mainBar.left}%`,
            height: chartOption?.mainBar?.barWidth,
          }}
        ></section>
        <section
          className="bullet-chart-mark-line"
          style={{
            backgroundColor: chartOption?.markLine?.color,
            left: `${markLine?.left}%`,
            height: chartOption?.markLine?.barWidth,
          }}
        ></section>
      </section>
      <ul
        ref={xAxisBoxRef}
        data-bullet-chart-x-axis-after=""
        className="bullet-chart-x-axis"
      >
        {max !== 0 && xAxisLabels?.slice(1)?.map((t: string) => {
          return (
            <li key={t} className="bullet-chart-x-axis-item">
              <span className="bullet-chart-x-axis-item-label">{t || '-'}</span>
            </li>
          );
        })}
      </ul>
      {/* 浮窗 */}
      {readyTipBox && createPortal(
        (
          <section
            ref={tooltipRef}
            className={`bullet-chart-tooltip-box ${tooltipClassName}`}
            style={{
              ...tooltipStyle,
              display: visibleTooltip ? 'block' : 'none',
              left,
              top,
            }}
          >
            {(Object.prototype.toString.call(tooltipFormatter) === '[object Function]')
              ? tooltipFormatter?.(tooltipData)
              : null/* defaultTooltipFormatter?.(tooltipData) */}
          </section>
        ),
        document.querySelector('.bullet-chart-bubble-tip-container') as Element,
      )}
    </section>
  )
}

BulletChart.defaultProps = DEFAULT_PROPS;

export default memo(BulletChart);

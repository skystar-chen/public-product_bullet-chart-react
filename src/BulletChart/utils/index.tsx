export const FORMAT_NUMBER_PARAM_KEY = '_entranceValue',
             SYMBOL_ARR = ['K', 'M', 'B', 'T'];

// 获取函数参数
export function getFuncParams(func: Function): string[] {
  let str = func?.toString() || '';

  str = str?.replace(/\/\*[\s\S]*?\*\//g, '')
    ?.replace(/\/\/(.)*/g, '')
    ?.replace(/{[\s\S]*}/, '')
    ?.replace(/=>/g, '')
    ?.trim();

  const start = str?.indexOf("(") + 1;

  const end = str?.length - 1;

  const result = str?.substring(start, end)?.split(", ");

  const params: string[] = [];

  result?.forEach((element) => {
    element = element?.replace(/=[\s\S]*/g, '')?.trim();
    if (element?.length > 0) {
      params.push(element);
    }
  });

  return params;
}

// 获取转换数值方法需要的正确参数
export function getParamsArr(paramsArr: any[], num: number): string[] {
  let isEntranceKey = false;
  const newParamsArr = paramsArr?.map((t: string) => {
    if (t === FORMAT_NUMBER_PARAM_KEY) {
      isEntranceKey = true;
      return num;
    } else {
      return t;
    }
  });

  return isEntranceKey ? newParamsArr : [num, ...paramsArr];
}

// 转换数值成K/M/B/T
export function getFormatNumberRes(
  // 转换数值成K/M/B/T的方法，用于转换刻度
  formatNumber: {
    func: Function | null, // 方法体
    params?: any[], // 方法中涉及的参数，其中参数为“_entranceValue”的将视为要转换的值传入的参数位置
  } | null | undefined,
  num: number,
): string {
  if (!formatNumber || (Object.prototype.toString.call(formatNumber?.func) !== '[object Function]')) return String(num);
  
  const paramsArr = (Array.isArray(formatNumber?.params) && formatNumber?.params?.length)
    ? getParamsArr(formatNumber?.params, num)
    : [num];
  
  return formatNumber?.func?.(...paramsArr);
}

// 计算出放大后的数字，间隔可以大于10是10的倍数时，每个刻度间隔是10的倍数
const getTempRes = (data: number, splitNum: number, symbolNum: number = 1) => {
  const interval = data / (splitNum * symbolNum);
  if (interval < 10) { // 间距不足10的时候
    return Math?.ceil(interval) * splitNum * symbolNum;
  } else {
    // 间隔是10的倍数时
    if (interval % 10 === 0) {
      return data;
    }

    // 不是10的倍数时扩大成间隔是10的倍数
    return Math?.ceil(Math?.floor(interval) / 10) * 10 * splitNum * symbolNum;
  }
}

// 判断放大后的数字转换单位后是否与原来单位一致，不一致的话需要继续递归放大，找到合适的数字
const getRes = (
  flag: boolean,
  data: number,
  splitNum: number,
  formatNumber: {
    func: Function | null,
    params?: any[],
  } | null | undefined,
) => {
  if (flag) {
    return data;
  } else {
    return getSuitMaxNumber(
      data,
      splitNum,
      true,
      formatNumber,
    );
  }
}

/**
 * 把一个数字分割成指定的段数，能够完整的分割，并且分割后每个刻度都是整数显示，找到这个数对应放大后的数
 * @param data 原始数据
 * @param splitNum 分割成多少段
 * @param isFormatNum 是否需要将数据转换K/M/B/T单位计算
 * @returns 之后放大后的数据
 */
export const getSuitMaxNumber = (
  data: number,
  splitNum: number,
  isFormatNum: boolean = true,
  // 转换数值成K/M/B/T的方法，用于转换刻度
  formatNumber: {
    func: Function | null, // 方法体
    params?: any[], // 方法中涉及的参数，其中参数为“_entranceValue”的将视为要转换的值传入的参数位置
  } | null | undefined,
): number => {
  let res = data, tempRes = data;
  const symbol: string | number = isFormatNum ? getFormatNumberRes(formatNumber, data)?.slice(-1) : data;
  const isChangeSymbol = SYMBOL_ARR?.includes(String(symbol));
  switch (true) {
    case isChangeSymbol:
      const symbolIndex = SYMBOL_ARR?.indexOf(String(symbol));
      tempRes = getTempRes(data, splitNum, Math.pow(10, (symbolIndex + 1) * 3));
      res = getRes(
        getFormatNumberRes(formatNumber, tempRes)?.slice(-1) === symbol,
        tempRes,
        splitNum,
        formatNumber,
      );
      break;

    /* case 'K':
      tempRes = getTempRes(data, splitNum, Math.pow(10, 3));
      res = getRes(
        getFormatNumberRes(formatNumber, tempRes)?.slice(-1) === 'K',
        tempRes,
        splitNum,
        formatNumber,
      );
      break;

    case 'M':
      tempRes = getTempRes(data, splitNum, Math.pow(10, 6));
      res = getRes(
        getFormatNumberRes(formatNumber, tempRes)?.slice(-1) === 'M',
        tempRes,
        splitNum,
        formatNumber,
      );
      break;

    case 'B':
      tempRes = getTempRes(data, splitNum, Math.pow(10, 9));
      res = getRes(
        getFormatNumberRes(formatNumber, tempRes)?.slice(-1) === 'B',
        tempRes,
        splitNum,
        formatNumber,
      );
      break;

    case 'T':
      tempRes = getTempRes(data, splitNum, Math.pow(10, 12));
      res = getRes(
        getFormatNumberRes(formatNumber, tempRes)?.slice(-1) === 'T',
        tempRes,
        splitNum,
        formatNumber,
      );
      break; */

    default:
      tempRes = getTempRes(data, splitNum);
      res = getRes(
        !SYMBOL_ARR?.includes(getFormatNumberRes(formatNumber, tempRes)?.slice(-1)),
        tempRes,
        splitNum,
        formatNumber,
      );
      break;
  }

  return res;
}

/* export const defaultTooltipFormatter = (data: any) => {
  return (
    <section className="bullet-chart-tooltip-body">
    </section>
  );
} */

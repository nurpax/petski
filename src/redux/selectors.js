
import memoize  from 'fast-memoize'
import {
  charScreencodeFromRowCol,
  rowColFromScreencode,
  systemFontData,
  systemFontDataLower,
  charOrderUpper,
  charOrderLower } from '../utils'
import { mirrorBrush, findTransformedChar } from './brush'
import { CHARSET_UPPER, CHARSET_LOWER } from './editor'

import { getCurrentScreenFramebufIndex } from './screensSelectors'

export const getFramebufByIndex = (state, idx) => {
  if (idx !== null && idx < state.framebufList.length) {
    return state.framebufList[idx].present
  }
  return null
}

export const getCurrentFramebuf = (state) => {
  return getFramebufByIndex(state, getCurrentScreenFramebufIndex(state))
}

const getFontBits = (charset) => {
  if (charset !== CHARSET_UPPER && charset !== CHARSET_LOWER) {
    console.error('unknown charset ', charset)
  }
  let bits = systemFontData
  let charOrder = charOrderUpper
  if (charset === CHARSET_LOWER) {
    bits = systemFontDataLower
    charOrder = charOrderLower
  }
  return {
    charset,
    bits,
    charOrder
  }
}

// getFontBits returns a new object every time it's called.  This causes
// serious cache invalidates in rendering the canvas (since it thinks the font
// changed).  So memoize the returned object from getFontBits in case it's
// called with the same value.
const getFontBitsMemoized = memoize(getFontBits)

export const getFramebufFont = (state, framebuf) => {
  return getFontBitsMemoized(framebuf.charset)
}

export const getCurrentFramebufFont = (state) => {
  const fb = getCurrentFramebuf(state)
  return getFramebufFont(state, fb)
}

const rowColFromScreencodeMemoized_ = (f, sc) => rowColFromScreencode(f, sc)
const rowColFromScreencodeMemoized = memoize(rowColFromScreencodeMemoized_)

const computeScreencodeWithTransform = (rowcol, font, transform) => {
  const sc = charScreencodeFromRowCol(font, rowcol)
  return findTransformedChar(font, sc, transform)
}
const computeScreencodeWithTransformMemoized = memoize(computeScreencodeWithTransform)
export const getScreencodeWithTransform = (rowcol, font, transform) => {
  return computeScreencodeWithTransformMemoized(rowcol, font, transform)
}

export const getCharRowColWithTransform = (rowcol, font, transform) => {
  const char = getScreencodeWithTransform(rowcol, font, transform)
  return rowColFromScreencodeMemoized(font, char)
}

const transformBrushMemoized = memoize(mirrorBrush)
export const transformBrush = (brush, transform, font) => {
  return transformBrushMemoized(brush, transform, font)
}

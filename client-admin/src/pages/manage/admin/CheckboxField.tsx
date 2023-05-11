import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Flex, Text } from 'theme-ui'
import PropTypes from 'prop-types'

import { handleZidMetadataUpdate } from '../../../actions'
import { RootState } from '../../../util/types'

export const CheckboxField = ({
  field,
  label = '',
  children = '',
  isIntegerBool = false
}) => {
  const { zid_metadata } = useSelector((state: RootState) => state.zid_metadata)
  const [state, setState] = useState(zid_metadata[field])
  const dispatch = useDispatch()

  const handleBoolValueChange = (field) => {
    const val = !state
    setState(val)
    dispatch(handleZidMetadataUpdate(zid_metadata, field, val))
  }

  const transformBoolToInt = (value) => {
    return value ? 1 : 0
  }

  const handleIntegerBoolValueChange = (field) => {
    const val = transformBoolToInt(!state)
    setState(val)
    dispatch(handleZidMetadataUpdate(zid_metadata, field, val))
  }

  return (
    <Box sx={{ mb: [3] }}>
        <label>
          <input
            type="checkbox"
            data-test-id={field}
            checked={
              isIntegerBool ? zid_metadata[field] === 1 : zid_metadata[field]
            }
            onChange={
              isIntegerBool
                ? () => handleIntegerBoolValueChange(field)
                : () => handleBoolValueChange(field)
            }
          />
          &nbsp;<strong>{label}</strong>
        </label>
      <Text sx={{ display: "inline", ml: [2], color: 'lightGray' }}>
        {children}
      </Text>
    </Box>
  )
}

CheckboxField.propTypes = {
  field: PropTypes.string.isRequired,
  label: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  isIntegerBool: PropTypes.bool
}

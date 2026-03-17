'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import BookingWidgetV1 from './v1';

export default function BookingWidgetV3(props: ThemeComponentProps) {
    const styles = {
        ...props.styles,
        showServices: typeof props.styles.showServices === 'boolean' ? props.styles.showServices : true,
        showDatePicker: typeof props.styles.showDatePicker === 'boolean' ? props.styles.showDatePicker : false,
        layout: typeof props.styles.layout === 'string' ? props.styles.layout : 'compact',
        variant: typeof props.styles.variant === 'string' ? props.styles.variant : 'compact',
    };

    return <BookingWidgetV1 {...props} styles={styles} />;
}

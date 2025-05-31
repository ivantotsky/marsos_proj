"use client";

import React from "react";
import Creatable from "react-select/creatable";

export function CreatableSelect(props) {
  return <Creatable {...props} className='w-full' classNamePrefix='select' />;
}

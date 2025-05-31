"use client";

import Link from "next/link";

const NavLinks = ({ show }) => {
  return (
    <div
      className={`hidden lg:block absolute top-full left-0 w-full z-40 ${
        show ? "block" : "hidden"
      } bg-white px-6 py-2 text-base text-[#2c6449] border-t border-b border-gray-200`}
    >
      <div className='flex items-center justify-between'>
        {/* LEFT: Categories + Navigation */}
        <div className='flex items-center space-x-6 rtl:space-x-reverse'>
          <Link
            href='/categories'
            className='flex items-center gap-1 font-semibold hover:text-[#1b4533]'
          >
            All Categories
          </Link>
          <Link href='/products' className='hover:text-[#1b4533]'>
            Featured
          </Link>
          <Link href='/products' className='hover:text-[#1b4533]'>
            Trending
          </Link>
        </div>

        {/* RIGHT: Support & Actions */}
        <div className='flex items-center space-x-6 rtl:space-x-reverse'>
          <Link href='/' className='hover:text-[#1b4533]'>
            Secured Trading
          </Link>
          <Link href='/help-center' className='hover:text-[#1b4533]'>
            Help Center
          </Link>
          <Link href='/become-supplier' className='hover:text-[#1b4533]'>
            Become a Supplier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavLinks;

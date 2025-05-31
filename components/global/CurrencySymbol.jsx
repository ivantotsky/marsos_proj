import Image from "next/image";
import sarSymbol from "../../public/sar_symbol.svg";

const Currency = ({ amount, className = "", iconClass = "" }) => {
  const numericAmount =
    typeof amount === "number" ? amount : parseFloat(amount || 0);

  const isValid = !isNaN(numericAmount) && isFinite(numericAmount);
  if (!isValid) {
    return (
      <span className='text-yellow-800 text-sm font-medium'>
        Pricing Negotiable - Contact Supplier
      </span>
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(numericAmount);

  return (
    <span className='inline-flex items-center gap-1'>
      {/* Wrap the symbol in a fixed‐size relative box */}
      <span className={`relative inline-block w-4 h-4 ${iconClass}`}>
        <Image
          src={sarSymbol}
          alt='SAR'
          fill
          className='object-contain'
          priority
        />
      </span>

      <span className={className}>{formattedAmount}</span>
    </span>
  );
};

export default Currency;

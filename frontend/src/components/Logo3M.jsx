import React from "react";

export default function Logo3M({ className = "h-10 w-auto", withText = true, textDark = true }) {
  return (
    <div className="flex items-center select-none">
      <img
        src="/Asset/logo-3m-services.png"
        alt="3M SERVICES - Logo Officiel"
        className={`${className} object-contain`}
        loading="eager"
      />
    </div>
  );
}

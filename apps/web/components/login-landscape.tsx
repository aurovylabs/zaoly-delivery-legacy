/** Decorative low-poly landscape for login and register. All motion is CSS driven. */
export function LoginLandscape() {
  return (
    <svg
      className="creation-login__landscape-svg"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="login-sky" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#f5ead6" />
          <stop offset=".55" stopColor="#ecd9bc" />
          <stop offset="1" stopColor="#cdd8d2" />
        </linearGradient>
        <linearGradient id="login-lake" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#9fb8b2" />
          <stop offset=".5" stopColor="#6f938f" />
          <stop offset="1" stopColor="#4a706f" />
        </linearGradient>
        <radialGradient id="login-sun-glow">
          <stop stopColor="#fff2cd" stopOpacity=".9" />
          <stop offset=".42" stopColor="#edc58c" stopOpacity=".42" />
          <stop offset="1" stopColor="#edc58c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="login-mist" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#f8f1e1" stopOpacity="0" />
          <stop offset=".4" stopColor="#f8f1e1" stopOpacity=".68" />
          <stop offset="1" stopColor="#f8f1e1" stopOpacity="0" />
        </linearGradient>
        <clipPath id="login-water-clip"><rect y="631" width="1600" height="269" /></clipPath>
      </defs>

      <rect width="1600" height="900" fill="url(#login-sky)" />
      <g className="login-landscape__light">
        <circle cx="1030" cy="315" r="280" fill="url(#login-sun-glow)" />
        <circle cx="1030" cy="315" r="58" fill="#f8e8ba" opacity=".88" />
      </g>

      <g className="login-landscape__cloud login-landscape__cloud--back" fill="#faf2e3" opacity=".42">
        <polygon points="-100,255 60,232 196,247 335,218 460,235 595,219 747,246 850,233 850,262 -100,276" />
        <polygon points="670,178 800,162 910,176 1040,154 1180,173 1310,151 1510,179 1680,161 1680,194 670,205" />
      </g>

      <g className="login-landscape__birds" fill="none" stroke="#3f625c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <g className="login-landscape__bird"><path d="M782 215 798 205 811 214 825 204 841 215" /></g>
        <g className="login-landscape__bird"><path d="M850 186 860 179 869 185 879 178 890 186" /></g>
        <g className="login-landscape__bird"><path d="M913 230 924 222 934 229 944 221 956 230" /></g>
      </g>

      <g className="login-landscape__mountain login-landscape__mountain--far">
        <polygon fill="#b9c5be" points="-60,537 90,420 205,475 390,356 565,454 740,342 890,434 1030,287 1178,424 1320,337 1470,430 1640,343 1640,650 -60,650" />
        <polygon fill="#d4d3c5" points="205,475 390,356 565,454 430,415 390,389 335,433" />
        <polygon fill="#e4ddca" points="740,342 890,434 803,410 748,375 691,405" />
        <polygon fill="#e8dbc4" points="1030,287 1178,424 1091,392 1032,326 967,372" />
        <polygon fill="#a9b9b5" points="1030,287 967,372 890,434 982,411 1020,362" />
        <polygon fill="#a6b6b1" points="1320,337 1470,430 1375,398 1312,369 1254,405" />
        <polygon fill="#dcd7c5" points="1470,430 1640,343 1640,410 1560,389" />
        <polygon fill="#98ada9" points="-60,537 90,420 205,475 140,464 71,461" />
      </g>

      <g className="login-landscape__cloud login-landscape__cloud--front" fill="#f8f2e7" opacity=".47">
        <polygon points="-100,490 60,476 184,488 336,465 475,482 612,456 750,472 912,447 1080,463 1240,439 1450,468 1700,441 1700,505 -100,513" />
        <polygon points="-100,521 120,512 312,525 490,502 666,524 820,507 1015,522 1190,497 1395,517 1700,493 1700,539 -100,543" />
      </g>

      <g className="login-landscape__mountain login-landscape__mountain--middle">
        <polygon fill="#72948d" points="-80,620 100,526 238,579 390,469 575,576 715,486 874,576 1050,438 1215,578 1370,472 1680,602 1680,684 -80,684" />
        <polygon fill="#8eaaa0" points="100,526 238,579 182,558 105,548 12,574" />
        <polygon fill="#a9b7a9" points="390,469 575,576 454,526 390,499 330,532" />
        <polygon fill="#9fb2a7" points="715,486 874,576 759,526 711,518 651,549" />
        <polygon fill="#a3b6a5" points="1050,438 1215,578 1105,520 1043,481 972,531" />
        <polygon fill="#486e6a" points="1050,438 972,531 874,576 1001,545 1066,506" />
        <polygon fill="#8da69c" points="1370,472 1680,602 1510,552 1390,505 1280,545" />
        <polygon fill="#4f7670" points="390,469 330,532 238,579 381,543 467,533" />
        <polygon fill="#557c75" points="715,486 651,549 575,576 706,552 784,540" />
      </g>

      <g className="login-landscape__mist login-landscape__mist--upper">
        <polygon fill="url(#login-mist)" points="-120,545 120,522 340,542 530,519 760,544 980,520 1210,548 1450,516 1720,544 1720,604 -120,604" />
        <polygon fill="#f7f0e3" opacity=".31" points="-80,574 175,556 390,579 610,555 880,581 1110,554 1360,579 1660,552 1660,605 -80,605" />
      </g>

      <rect y="631" width="1600" height="269" fill="url(#login-lake)" />
      <g clipPath="url(#login-water-clip)">
        <g className="login-landscape__reflection login-landscape__reflection--mountains" opacity=".22">
          <polygon fill="#d6d6c5" points="80,631 386,631 228,786" />
          <polygon fill="#d7dbc9" points="552,631 883,631 723,826" />
          <polygon fill="#e6d6b9" points="890,631 1180,631 1030,879" />
          <polygon fill="#d9d8c7" points="1210,631 1630,631 1392,845" />
        </g>
        <g className="login-landscape__reflection login-landscape__reflection--light" fill="#eed4a6" opacity=".5">
          <polygon points="1007,631 1055,631 1090,900 958,900" />
          <polygon points="1050,650 1140,650 1160,658 1026,660" />
          <polygon points="935,713 1112,709 1162,716 929,721" />
          <polygon points="900,787 1165,783 1225,792 862,799" />
          <polygon points="840,868 1215,861 1280,871 805,882" />
        </g>
        <g className="login-landscape__water-facets" fill="#d4e1d7" opacity=".28">
          <polygon points="0,676 170,663 311,680 90,689" />
          <polygon points="256,742 508,733 570,744 333,756" />
          <polygon points="20,819 310,803 431,817 136,832" />
          <polygon points="550,669 770,661 829,672 646,682" />
          <polygon points="630,845 855,830 961,841 723,858" />
          <polygon points="1190,672 1460,661 1600,677 1317,690" />
          <polygon points="1270,754 1600,740 1600,758 1340,771" />
          <polygon points="1135,851 1460,837 1600,846 1290,865" />
        </g>
        <g className="login-landscape__ripples" fill="#f7ebd2" opacity=".48">
          <polygon points="80,705 270,701 304,704 69,710" />
          <polygon points="365,698 554,694 595,699 348,704" />
          <polygon points="685,723 817,719 856,722 671,728" />
          <polygon points="1138,694 1303,690 1345,694 1120,699" />
          <polygon points="1380,724 1575,719 1615,723 1364,730" />
          <polygon points="171,775 419,769 464,774 153,782" />
          <polygon points="690,781 887,776 922,780 671,788" />
          <polygon points="1160,812 1400,806 1454,811 1139,820" />
        </g>
      </g>

      <g className="login-landscape__shore" fill="#385b56">
        <polygon points="-80,633 65,605 149,624 278,614 359,632 470,621 574,638 661,630 761,641 841,629 952,641 1060,623 1174,639 1290,623 1425,637 1528,617 1680,634 1680,651 -80,651" />
        <polygon fill="#56796d" points="-80,633 149,624 278,614 208,630 89,635" />
        <polygon fill="#52766d" points="952,641 1060,623 1174,639 1080,634" />
        <polygon fill="#688477" points="1290,623 1425,637 1528,617 1467,640" />
      </g>

      <g className="login-landscape__island">
        <polygon fill="#315650" points="1170,629 1244,587 1346,598 1432,563 1560,604 1680,581 1680,680 1170,665" />
        <polygon fill="#4a7064" points="1244,587 1346,598 1432,563 1355,625 1290,613" />
        <polygon fill="#6f8871" points="1432,563 1560,604 1680,581 1570,636" />
        <polygon fill="#1f4744" points="1170,665 1680,680 1680,711 1220,690" />
      </g>

      <g className="login-landscape__pavilion" fill="#203f3d" stroke="#203f3d" strokeWidth="5" strokeLinejoin="round">
        <polygon points="1325,576 1380,548 1460,548 1520,576 1492,581 1352,581" />
        <polygon fill="#385a52" points="1360,548 1407,526 1435,526 1485,548" />
        <path d="M1364 583v69m42-69v69m64-69v69m37-69v69M1345 653h163M1358 627h136" fill="none" />
        <polygon fill="#a9a98a" stroke="none" points="1408,586 1468,586 1468,625 1408,625" opacity=".62" />
      </g>

      <g className="login-landscape__pine login-landscape__pine--right">
        <path d="M1540 658 1547 438 1524 390M1545 493l74-78M1545 542l-61-69" fill="none" stroke="#193c38" strokeWidth="13" strokeLinecap="round" />
        <polygon fill="#173b37" points="1494,400 1528,368 1577,375 1611,403 1568,412 1520,416" />
        <polygon fill="#244d43" points="1562,433 1608,393 1663,406 1695,434 1636,446 1594,445" />
        <polygon fill="#1d453e" points="1449,485 1485,454 1530,460 1566,491 1510,501 1470,497" />
        <polygon fill="#355e4e" points="1509,374 1577,375 1611,403 1568,397" />
      </g>
      <g className="login-landscape__pine login-landscape__pine--small">
        <path d="M1221 637 1228 553M1227 594l-29-29M1227 584l32-32" fill="none" stroke="#244b43" strokeWidth="7" strokeLinecap="round" />
        <polygon fill="#244b43" points="1180,566 1203,545 1236,548 1258,567 1222,574" />
        <polygon fill="#315a4a" points="1234,556 1256,536 1284,543 1306,559 1268,568" />
      </g>

      <g className="login-landscape__mist login-landscape__mist--lower">
        <polygon fill="url(#login-mist)" points="-100,623 120,608 320,627 515,605 738,628 940,607 1150,632 1370,611 1700,632 1700,677 -100,677" />
        <polygon fill="#f6efe1" opacity=".24" points="-80,644 180,635 360,650 610,634 870,654 1110,633 1360,649 1660,635 1660,664 -80,664" />
      </g>

      <g className="login-landscape__splash login-landscape__splash--start" fill="none" stroke="#e5ede1" strokeWidth="3" strokeLinecap="round">
        <path d="M917 674q16-8 34 0M925 664l-5-8M943 663l6-9" />
      </g>
      <g className="login-landscape__fish" fill="#244f49">
        <polygon points="926,671 938,663 953,661 968,667 955,674 939,675" />
        <polygon points="929,670 919,661 919,677" />
        <polygon fill="#5d8274" points="938,663 947,655 952,662" />
        <circle cx="958" cy="667" r="1.5" fill="#f5ead6" />
      </g>
      <g className="login-landscape__splash login-landscape__splash--end" fill="none" stroke="#e5ede1" strokeWidth="3" strokeLinecap="round">
        <path d="M1010 674q18-9 38 0M1018 665l-5-9M1040 665l6-10" />
      </g>
    </svg>
  )
}

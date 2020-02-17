'use strict';
module.exports = {
  "OPTION_VIEW_TYPE": [
    {
      "code": "SELECT",
      "comments": "SELECT"
    },
    {
      "code": "RADIO",
      "comments": "RADIO"
    },
    {
      "code": "BUTTON",
      "comments": "BUTTON"
    }
  ],
  "DATA_STATUS": [
    {
      "code": "D",
      "comments": "삭제"
    },
    {
      "code": "Y",
      "comments": "사용"
    }
  ],
  "USER_STATUS": [
    {
      "code": "O",
      "comments": "탈퇴"
    },
    {
      "code": "D",
      "comments": "삭제"
    },
    {
      "code": "W",
      "comments": "대기"
    },
    {
      "code": "A",
      "comments": "승인"
    },
    {
      "code": "R",
      "comments": "거절"
    }
  ],
  "BIZ_TYPE_RETAIL": [
    {
      "code": "BTR1",
      "comments": "Online: SOHO Mall"
    },
    {
      "code": "BTR2",
      "comments": "Online: Open Market"
    },
    {
      "code": "BTR3",
      "comments": "Online: Influencer"
    },
    {
      "code": "BTR4",
      "comments": "Offline: Cosmetics Store"
    },
    {
      "code": "BTR5",
      "comments": "Offline: Beauty Salon"
    },
    {
      "code": "BTR6",
      "comments": "Offline: Supermarket"
    },
    {
      "code": "BTR7",
      "comments": "Offline: Mom & Pop"
    }
  ],
  "PRODUCT_STATUS": [
    {
      "code": "W",
      "comments": "대기"
    },
    {
      "code": "A",
      "comments": "승인"
    },
    {
      "code": "R",
      "comments": "거절"
    },
    {
      "code": "D",
      "comments": "삭제"
    }
  ],
  "BIZ_TYPE_WHOLE": [
    {
      "code": "BTW1",
      "comments": "Online: SOHO Mall"
    },
    {
      "code": "BTW2",
      "comments": "Online: Open Market"
    },
    {
      "code": "BTW3",
      "comments": "Online: Influencer"
    },
    {
      "code": "BTW4",
      "comments": "Offline: Cosmetics Store"
    },
    {
      "code": "BTW5",
      "comments": "Offline: Beauty Salon"
    },
    {
      "code": "BTW6",
      "comments": "Offline: Supermarket"
    },
    {
      "code": "BTW7",
      "comments": "Offline: Mom & Pop"
    }
  ],
  "USER_TYPE": {
    "A": [
      {
        "code": "SA",
        "comments": "슈퍼관리자"
      },
      {
        "code": "NA",
        "comments": "일반관리자"
      },
      {
        "code": "LA",
        "comments": "물류관리자"
      },
      {
        "code": "FA",
        "comments": "재무관리자"
      },
      {
        "code": "OA",
        "comments": "운영관리자"
      },
      {
        "code": "VA",
        "comments": "벤더관리자"
      }
    ],
    "B": [
      {
        "code": "R",
        "comments": "Retailer"
      },
      {
        "code": "W",
        "comments": "Wholesale"
      }
    ],
    "S": []
  },
  "CAPACITY_TYPE": [
    {
      "code": "ML",
      "comments": "ml"
    },
    {
      "code": "G",
      "comments": "g"
    },
    {
      "code": "GML",
      "comments": "g/ml"
    }
  ],
  "INCOTERMS": [
    {
      "code": "FCA",
      "comments": "Free Carrier"
    },
    {
      "code": "EXW",
      "comments": "Ex Works"
    },
    {
      "code": "DAP",
      "comments": "Delivered At Place"
    }
  ],
  "BIZ_TYPE": [
    {
      "code": "CS",
      "comments": "Large Distribution (Chain Stores)"
    },
    {
      "code": "DS",
      "comments": "Drug Store"
    },
    {
      "code": "DFS",
      "comments": "Duty Free Shops"
    },
    {
      "code": "EC",
      "comments": "E-Commerce"
    },
    {
      "code": "DTB",
      "comments": "Distributor"
    },
    {
      "code": "BS",
      "comments": "Beauty Salon"
    },
    {
      "code": "HS",
      "comments": "Hair Salon"
    },
    {
      "code": "NS",
      "comments": "Nail Salon"
    },
    {
      "code": "SPA",
      "comments": "Spa"
    },
    {
      "code": "ETC",
      "comments": "ETC"
    }
  ],
  "BIZ_VOLUME": [
    {
      "code": "LV0",
      "comments": "I prefer not to say"
    },
    {
      "code": "LV1",
      "comments": "$0M ~ $1M"
    },
    {
      "code": "LV2",
      "comments": "$1M ~ $2M"
    },
    {
      "code": "LV3",
      "comments": "$2M ~ $5M"
    },
    {
      "code": "LV4",
      "comments": "$5M ~ $20M"
    },
    {
      "code": "LV5",
      "comments": "$20M ~ $50M"
    },
    {
      "code": "LV6",
      "comments": "$50M ~ $100M"
    },
    {
      "code": "LV7",
      "comments": "$100M ~ $200M"
    },
    {
      "code": "LV8",
      "comments": "$200M ~ $500M"
    },
    {
      "code": "LV9",
      "comments": "$500M+"
    }
  ],
  "PAYMENT_METHOD": [
    {
      "code": "P",
      "comments": "Paypal"
    },
    {
      "code": "T",
      "comments": "Telegraphic Transfer"
    },
    {
      "code": "AD",
      "comments": "All Debit Payment"
    }
  ],
  "PAYMENT_TYPE": [
    {
      "code": "PAYMENT",
      "comments": "결제"
    },
    {
      "code": "REFUND",
      "comments": "환불"
    },
    {
      "code": "PARTIAL_REFUND",
      "comments": "부분환불"
    },
    {
      "code": "PARTIAL_PAYMENT",
      "comments": "부분결제"
    },
    {
      "code": "RETURN",
      "comments": "반품"
    }
  ],
  "MSDS_TYPE": [
    {
      "code": "DG",
      "comments": "DG(특수 포장 필요)"
    },
    {
      "code": "NDG",
      "comments": "Non-DG(일반 포장 배송 가능)"
    }
  ],
  "INQUIRY_TYPE": [
    {
      "code": "PR",
      "comments": "PARTNERSHIP"
    },
    {
      "code": "SY",
      "comments": "SYSTEM"
    },
    {
      "code": "P",
      "comments": "PRODUCT"
    },
    {
      "code": "D",
      "comments": "DELIVERY"
    },
    {
      "code": "PY",
      "comments": "PAYMENT"
    },
    {
      "code": "E",
      "comments": "ETC"
    }
  ],
  "BANNER_TYPE": [
    {
      "code": "BRAND",
      "comments": "브랜드 링크"
    },
    {
      "code": "PRODUCT",
      "comments": "상품 링크"
    },
    {
      "code": "INTERNAL",
      "comments": "내부 링크"
    },
    {
      "code": "EXTERNAL",
      "comments": "외부 링크"
    }
  ],
  "DISTRIBUTION_CHANNEL": [
    {
      "code": "DC1",
      "comments": "Amazon"
    },
    {
      "code": "DC2",
      "comments": "Anthropologie"
    },
    {
      "code": "DC3",
      "comments": "As Nature Intended"
    },
    {
      "code": "DC4",
      "comments": "AS Watson Group"
    },
    {
      "code": "DC5",
      "comments": "Bartell Drug"
    },
    {
      "code": "DC6",
      "comments": "Bath & Body Works"
    },
    {
      "code": "DC7",
      "comments": "Beauty 4 U"
    },
    {
      "code": "DC8",
      "comments": "Beauty Collection"
    },
    {
      "code": "DC9",
      "comments": "BeautyCareChoices.com"
    },
    {
      "code": "DC10",
      "comments": "Bed Bath & Beyond"
    },
    {
      "code": "DC11",
      "comments": "Belk"
    },
    {
      "code": "DC12",
      "comments": "Big W"
    },
    {
      "code": "DC13",
      "comments": "Bi-Mart"
    },
    {
      "code": "DC14",
      "comments": "Birchbox"
    },
    {
      "code": "DC15",
      "comments": "Bloomingdale's"
    },
    {
      "code": "DC16",
      "comments": "Boots"
    },
    {
      "code": "DC17",
      "comments": "Boscov’s"
    },
    {
      "code": "DC18",
      "comments": "Burlington Coat Factory"
    },
    {
      "code": "DC19",
      "comments": "Canyon Ranch"
    },
    {
      "code": "DC20",
      "comments": "Centro Natural"
    },
    {
      "code": "DC21",
      "comments": "Charlotte Russe"
    },
    {
      "code": "DC22",
      "comments": "Charming Charlie"
    },
    {
      "code": "DC23",
      "comments": "Citi Trends"
    },
    {
      "code": "DC24",
      "comments": "Claire's"
    },
    {
      "code": "DC25",
      "comments": "Clean Beauty Mart"
    },
    {
      "code": "DC26",
      "comments": "Coast Guard Exchange"
    },
    {
      "code": "DC27",
      "comments": "Coles"
    },
    {
      "code": "DC28",
      "comments": "Cost Plus World Market"
    },
    {
      "code": "DC29",
      "comments": "Costco"
    },
    {
      "code": "DC30",
      "comments": "Cracker Barrel Old Country Stores"
    },
    {
      "code": "DC31",
      "comments": "Crest Fresh Market"
    },
    {
      "code": "DC32",
      "comments": "Debenhams"
    },
    {
      "code": "DC33",
      "comments": "dermstore.com"
    },
    {
      "code": "DC34",
      "comments": "Dillard's"
    },
    {
      "code": "DC35",
      "comments": "Discount Drug Mart"
    },
    {
      "code": "DC36",
      "comments": "Dollar General"
    },
    {
      "code": "DC37",
      "comments": "Dollar Tree"
    },
    {
      "code": "DC38",
      "comments": "Earth Origins Market"
    },
    {
      "code": "DC39",
      "comments": "Ebay"
    },
    {
      "code": "DC40",
      "comments": "El Cortes Ingles"
    },
    {
      "code": "DC41",
      "comments": "Elegant Beauty Supplies"
    },
    {
      "code": "DC42",
      "comments": "Etsy.com"
    },
    {
      "code": "DC43",
      "comments": "Evine Live"
    },
    {
      "code": "DC44",
      "comments": "Family Dollar Stores"
    },
    {
      "code": "DC45",
      "comments": "Feel Beauty Supply"
    },
    {
      "code": "DC46",
      "comments": "Feelunique"
    },
    {
      "code": "DC47",
      "comments": "Fenwick"
    },
    {
      "code": "DC48",
      "comments": "Food Lion"
    },
    {
      "code": "DC49",
      "comments": "Food4Less"
    },
    {
      "code": "DC50",
      "comments": "Fred Meyer"
    },
    {
      "code": "DC51",
      "comments": "Free People"
    },
    {
      "code": "DC52",
      "comments": "Fuego"
    },
    {
      "code": "DC53",
      "comments": "Gala Fresh Farms"
    },
    {
      "code": "DC54",
      "comments": "GNC"
    },
    {
      "code": "DC55",
      "comments": "Haggen"
    },
    {
      "code": "DC56",
      "comments": "Hammacher Schlemmer"
    },
    {
      "code": "DC57",
      "comments": "Hannaford"
    },
    {
      "code": "DC58",
      "comments": "HB Beauty Bar"
    },
    {
      "code": "DC59",
      "comments": "HEB"
    },
    {
      "code": "DC60",
      "comments": "Hera Beauty"
    },
    {
      "code": "DC61",
      "comments": "Holland and Barrett"
    },
    {
      "code": "DC62",
      "comments": "HSN"
    },
    {
      "code": "DC63",
      "comments": "Icing"
    },
    {
      "code": "DC64",
      "comments": "iHerb"
    },
    {
      "code": "DC65",
      "comments": "Ipsy"
    },
    {
      "code": "DC66",
      "comments": "Jean Coutu"
    },
    {
      "code": "DC67",
      "comments": "Jet"
    },
    {
      "code": "DC68",
      "comments": "King Soopers"
    },
    {
      "code": "DC69",
      "comments": "Kitchen Collection"
    },
    {
      "code": "DC70",
      "comments": "Kohl's"
    },
    {
      "code": "DC71",
      "comments": "Kotsovolos"
    },
    {
      "code": "DC72",
      "comments": "Kroger"
    },
    {
      "code": "DC73",
      "comments": "Lidl"
    },
    {
      "code": "DC74",
      "comments": "London Drugs"
    },
    {
      "code": "DC75",
      "comments": "Lord & Taylor"
    },
    {
      "code": "DC76",
      "comments": "Lucky Vitamin"
    },
    {
      "code": "DC77",
      "comments": "Maceys"
    },
    {
      "code": "DC78",
      "comments": "Mac's Fresh Market"
    },
    {
      "code": "DC79",
      "comments": "Macy's"
    },
    {
      "code": "DC80",
      "comments": "Maison Baby"
    },
    {
      "code": "DC81",
      "comments": "Mariano’s"
    },
    {
      "code": "DC82",
      "comments": "Marine Corps Exchange"
    },
    {
      "code": "DC83",
      "comments": "Marks & Spencer"
    },
    {
      "code": "DC84",
      "comments": "Marlene's Market & Deli"
    },
    {
      "code": "DC85",
      "comments": "Meijer"
    },
    {
      "code": "DC86",
      "comments": "Nature's Fare"
    },
    {
      "code": "DC87",
      "comments": "Neiman Marcus"
    },
    {
      "code": "DC88",
      "comments": "Newegg.com"
    },
    {
      "code": "DC89",
      "comments": "NEX Navy Exchange"
    },
    {
      "code": "DC90",
      "comments": "Next"
    },
    {
      "code": "DC91",
      "comments": "Nordstrom"
    },
    {
      "code": "DC92",
      "comments": "Nugget Market"
    },
    {
      "code": "DC93",
      "comments": "Nutrition Smart"
    },
    {
      "code": "DC94",
      "comments": "Overstock.com"
    },
    {
      "code": "DC95",
      "comments": "PCC Natural Markets"
    },
    {
      "code": "DC96",
      "comments": "Peninsula Beauty"
    },
    {
      "code": "DC97",
      "comments": "Pharmaca"
    },
    {
      "code": "DC98",
      "comments": "Pharmaprix"
    },
    {
      "code": "DC99",
      "comments": "Planet Beauty"
    },
    {
      "code": "DC100",
      "comments": "Planet Organic"
    },
    {
      "code": "DC101",
      "comments": "Rainbow Shops"
    },
    {
      "code": "DC102",
      "comments": "Ralphs"
    },
    {
      "code": "DC103",
      "comments": "Rexall"
    },
    {
      "code": "DC104",
      "comments": "Riley Rose"
    },
    {
      "code": "DC105",
      "comments": "Saks"
    },
    {
      "code": "DC106",
      "comments": "Sally Beauty"
    },
    {
      "code": "DC107",
      "comments": "Selfridges"
    },
    {
      "code": "DC108",
      "comments": "Sephora"
    },
    {
      "code": "DC109",
      "comments": "Sleek Hair"
    },
    {
      "code": "DC110",
      "comments": "Snuggle Bugz"
    },
    {
      "code": "DC111",
      "comments": "Soko Glam"
    },
    {
      "code": "DC112",
      "comments": "Space NK"
    },
    {
      "code": "DC113",
      "comments": "Spring Market"
    },
    {
      "code": "DC114",
      "comments": "Target"
    },
    {
      "code": "DC115",
      "comments": "Teknikmagasinet"
    },
    {
      "code": "DC116",
      "comments": "The Happy Herb Company"
    },
    {
      "code": "DC117",
      "comments": "The Hut Group"
    },
    {
      "code": "DC118",
      "comments": "The Makeup Club"
    },
    {
      "code": "DC119",
      "comments": "TheGrommet"
    },
    {
      "code": "DC120",
      "comments": "Topshop"
    },
    {
      "code": "DC121",
      "comments": "ULTA"
    },
    {
      "code": "DC122",
      "comments": "Uncommon Goods"
    },
    {
      "code": "DC123",
      "comments": "Uniprix"
    },
    {
      "code": "DC124",
      "comments": "Urban Outfitters"
    },
    {
      "code": "DC125",
      "comments": "Vita-Cost"
    },
    {
      "code": "DC126",
      "comments": "Walgreens"
    },
    {
      "code": "DC127",
      "comments": "Walmart"
    },
    {
      "code": "DC128",
      "comments": "West Coast Beauty"
    },
    {
      "code": "DC129",
      "comments": "Wigs.com"
    }
  ],
  "EMAIL_TYPE": [
    {
      "code": "RN",
      "comments": "Release notes"
    },
    {
      "code": "EN",
      "comments": "Error notification"
    }
  ],
  "REFUND_STATUS": [
    {
      "code": "1",
      "comments": "반품 신청"
    },
    {
      "code": "2",
      "comments": "환불 신청"
    },
    {
      "code": "3",
      "comments": "오배송"
    },
    {
      "code": "4",
      "comments": "미배송"
    }
  ],
  "ORDER_TYPE": [
    {
      "code": "O",
      "comments": "주문"
    },
    {
      "code": "P",
      "comments": "가견적서"
    },
    {
      "code": "Q",
      "comments": "Quote"
    }
  ],
  "OPERATION": [
    {
      "code": "L",
      "comments": "물류"
    },
    {
      "code": "O",
      "comments": "운영"
    },
    {
      "code": "P",
      "comments": "금액"
    }
  ],
  "COMMON_SITE": [
    {
      "code": "EMAIL",
      "comments": "이메일"
    },
    {
      "code": "CONTACT",
      "comments": "연락처(번호)"
    },
    {
      "code": "ADDRESS",
      "comments": "주소"
    }
  ],
  "PLACEMENT": [
    {
      "code": "HEADER",
      "comments": "헤더"
    },
    {
      "code": "FOOTER",
      "comments": "푸터"
    },
    {
      "code": "ETC",
      "comments": "기타"
    }
  ],
  "COMPANY_STATUS": [
    {
      "code": "W",
      "comments": "대기"
    },
    {
      "code": "A",
      "comments": "승인"
    },
    {
      "code": "RU",
      "comments": "수정거절"
    },
    {
      "code": "UR",
      "comments": "수정요청"
    },
    {
      "code": "RS",
      "comments": "가입거절"
    },
    {
      "code": "O",
      "comments": "탈퇴"
    },
    {
      "code": "E",
      "comments": "만료"
    }
  ],
  "B2LINK_DEPT": [
    {
      "code": "GS",
      "comments": "GS"
    },
    {
      "code": "CBT",
      "comments": "CBT"
    },
    {
      "code": "OTHERS",
      "comments": "OTHERS"
    },
    {
      "code": "USP",
      "comments": "USP"
    },
    {
      "code": "UO",
      "comments": "UO"
    }
  ],
  "PRODUCT_TYPE": [
    {
      "code": "SINGLE",
      "comments": "단품상품"
    },
    {
      "code": "COMPOSITE",
      "comments": "복합상품"
    }
  ],
  "PRODUCT_OPTION_STATUS": [
    {
      "code": "0",
      "comments": "미사용"
    },
    {
      "code": "1",
      "comments": "사용"
    }
  ],
  "APPROVED_STATUS": [
    {
      "code": "W",
      "comments": "대기"
    },
    {
      "code": "A",
      "comments": "승인"
    },
    {
      "code": "R",
      "comments": "거절"
    },
    {
      "code": "D",
      "comments": "삭제"
    }
  ],
  "AUTHORIZATION_CERTIFICATION": [
    {
      "code": "AC1",
      "comments": "Made Safe"
    },
    {
      "code": "AC2",
      "comments": "Leaping Bunny Approved"
    },
    {
      "code": "AC3",
      "comments": "ISO 22716:2007"
    },
    {
      "code": "AC4",
      "comments": "Halal Certification"
    },
    {
      "code": "AC5",
      "comments": "Gluten-Reduced Certified"
    },
    {
      "code": "AC6",
      "comments": "Global Certification Service Ltd"
    },
    {
      "code": "AC7",
      "comments": "FDA Antibiotic Free"
    },
    {
      "code": "AC8",
      "comments": "Fair Trade Certified"
    },
    {
      "code": "AC9",
      "comments": "EWG Verified"
    },
    {
      "code": "AC10",
      "comments": "EcoCert"
    },
    {
      "code": "AC11",
      "comments": "Vegan Certified"
    },
    {
      "code": "AC12",
      "comments": "US Halal Certification"
    },
    {
      "code": "AC13",
      "comments": "USDA Organic"
    },
    {
      "code": "AC14",
      "comments": "USDA Certified Biobased Product"
    },
    {
      "code": "AC15",
      "comments": "USDA BioPreferred"
    },
    {
      "code": "AC16",
      "comments": "UL Certification"
    },
    {
      "code": "AC17",
      "comments": "The Green Good Housekeeping Seal"
    },
    {
      "code": "AC18",
      "comments": "SGS Product Certified"
    },
    {
      "code": "AC19",
      "comments": "SEDEX Certified"
    },
    {
      "code": "AC20",
      "comments": "PFOA Free"
    },
    {
      "code": "AC21",
      "comments": "PETA Cruelty Free and Vegan"
    },
    {
      "code": "AC22",
      "comments": "PETA Cruelty Free"
    },
    {
      "code": "AC23",
      "comments": "PEFC"
    },
    {
      "code": "AC24",
      "comments": "Paleo Certified"
    },
    {
      "code": "AC25",
      "comments": "NSF Non-GMO"
    },
    {
      "code": "AC26",
      "comments": "NSF GMP"
    },
    {
      "code": "AC27",
      "comments": "NSF/ANSI 305"
    },
    {
      "code": "AC28",
      "comments": "NPA Natural Seal: Personal Care"
    },
    {
      "code": "AC29",
      "comments": "Non-GMO Tested -- International GMO Evaluation Notification Program (IGEN)"
    },
    {
      "code": "AC30",
      "comments": "PDO - Protected Designation of Origin"
    },
    {
      "code": "AC31",
      "comments": "DesignLights Consortium (DLC) Certification"
    },
    {
      "code": "AC32",
      "comments": "COSMOS-standard"
    },
    {
      "code": "AC33",
      "comments": "Codex GMP"
    },
    {
      "code": "AC34",
      "comments": "Choose Cruelty Free"
    },
    {
      "code": "AC35",
      "comments": "Certified Organic"
    },
    {
      "code": "AC36",
      "comments": "CCOF Organic"
    },
    {
      "code": "AC37",
      "comments": "CCIC cruelty free"
    },
    {
      "code": "AC38",
      "comments": "BPA Free"
    },
    {
      "code": "AC39",
      "comments": "BFC"
    },
    {
      "code": "AC40",
      "comments": "Australian Certified Organic"
    },
    {
      "code": "AC41",
      "comments": "Banned Substances Control Group (BSCG)"
    },
    {
      "code": "AC42",
      "comments": "Generally Recognized as Safe (GRAS)"
    },
    {
      "code": "AC43",
      "comments": "Health Canada"
    }
  ],
  "FAQ_TYPE": [
    {
      "code": "A",
      "comments": "About UMMA"
    },
    {
      "code": "H",
      "comments": "How UMMA Works"
    },
    {
      "code": "S",
      "comments": "Signing Up"
    }
  ],
  "INQUIRY_STATUS": [
    {
      "code": "0",
      "comments": "ONGOING"
    },
    {
      "code": "1",
      "comments": "COMPLETED"
    }
  ],
  "ADV_TYPE": [
    {
      "code": "B2LINK",
      "comments": "B2LINK"
    },
    {
      "code": "WM",
      "comments": "Word of mouth"
    },
    {
      "code": "SM",
      "comments": "Social Media"
    },
    {
      "code": "OA",
      "comments": "Online ads"
    },
    {
      "code": "G",
      "comments": "Google"
    },
    {
      "code": "O",
      "comments": "Others"
    }
  ],
  "K_BIZ_SCALE": [
    {
      "code": "LV0",
      "comments": "I prefer not to say"
    },
    {
      "code": "LV1",
      "comments": "$0M ~ $0.5M"
    },
    {
      "code": "LV2",
      "comments": "$0.5M ~ $1M"
    },
    {
      "code": "LV3",
      "comments": "$1M ~ $2M"
    },
    {
      "code": "LV4",
      "comments": "$2M ~ $5M"
    },
    {
      "code": "LV5",
      "comments": "$5M ~ $10M"
    },
    {
      "code": "LV6",
      "comments": "10M ~ $20M"
    },
    {
      "code": "LV7",
      "comments": "$20M ~ $50M"
    },
    {
      "code": "LV8",
      "comments": "$50M ~ "
    }
  ],
  "OPTION_TYPE": [
    {
      "code": "C",
      "comments": "색상"
    },
    {
      "code": "V",
      "comments": "용량"
    },
    {
      "code": "ST",
      "comments": "피부조건"
    },
    {
      "code": "F",
      "comments": "FUNCTIONAL"
    }
  ],
  "ADMIN_ROLE": [
    {
      "code": 11,
      "comments": "SA"
    },
    {
      "code": 12,
      "comments": "NA"
    },
    {
      "code": 13,
      "comments": "OA"
    },
    {
      "code": 14,
      "comments": "LA"
    },
    {
      "code": 15,
      "comments": "VA"
    },
    {
      "code": 16,
      "comments": "FA"
    }
  ],
  "COMPLETE_STATUS": [
    {
      "code": 0,
      "comments": "PAYMENT WAITING"
    },
    {
      "code": 1,
      "comments": "PAYMENT COMPLETE"
    },
    {
      "code": 2,
      "comments": "LOADING ITEMS"
    },
    {
      "code": 3,
      "comments": "ON DELIVERY"
    },
    {
      "code": 4,
      "comments": "ARRIVED"
    },
    {
      "code": 5,
      "comments": "ORDER COMPLETE"
    },
    {
      "code": 6,
      "comments": "ORDER CANCELED"
    }
  ],
  "DP": [
    {
      "code": 0,
      "comments": "미노출"
    },
    {
      "code": 1,
      "comments": "노출"
    }
  ],
  "YN": [
    {
      "code": "Y",
      "comments": "예"
    },
    {
      "code": "N",
      "comments": "아니오"
    }
  ],
  "TFYN": [
    {
      "code": 0,
      "comments": "아니오"
    },
    {
      "code": 1,
      "comments": "예"
    }
  ],
  "RT": [
    {
      "code": 1,
      "comments": "반품 신청"
    },
    {
      "code": 10,
      "comments": "환불 신청"
    }
  ],
  "URT": [
    {
      "code": 2,
      "comments": "반품 확인중"
    },
    {
      "code": 3,
      "comments": "반품 완료"
    },
    {
      "code": 20,
      "comments": "환불 확인중"
    },
    {
      "code": 30,
      "comments": "환불 완료"
    }
  ],
  "PS": [
    {
      "code": "0",
      "comments": "미확인"
    },
    {
      "code": "1",
      "comments": "승인"
    },
    {
      "code": "-1",
      "comments": "반려"
    }
  ],
  "OS": [
    {
      "code": 0,
      "comments": "견적대기"
    },
    {
      "code": 1,
      "comments": "결제완료"
    },
    {
      "code": 2,
      "comments": "상품 준비중"
    },
    {
      "code": 3,
      "comments": "배송중"
    },
    {
      "code": 4,
      "comments": "배송완료"
    },
    {
      "code": 5,
      "comments": "주문완료"
    },
    {
      "code": 6,
      "comments": "주문취소"
    }
  ]
};

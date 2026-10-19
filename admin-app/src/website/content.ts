export type Lang = 'zh' | 'en';

/** 对外联系方式。留空时页面显示「资料待补充」，请在此填写真实信息。 */
export const CONTACT = {
  regionZh: '山西',
  regionEn: 'Shanxi, China',
  phone: '',
  email: '',
  addressZh: '',
  addressEn: '',
};

export type Step = { title: string; body: string };
export type Card = { title: string; body: string };

export type SiteCopy = {
  brand: string;
  brandEn: string;
  tagline: string;
  nav: {
    home: string;
    process: string;
    products: string;
    compliance: string;
    about: string;
    inquiry: string;
    contact: string;
  };
  langLabel: string;
  menuOpen: string;
  menuClose: string;
  footer: {
    blurb: string;
    visit: string;
    staff: string;
    rights: string;
  };
  pending: string;
  home: {
    kicker: string;
    title: string;
    lead: string;
    ctaProcess: string;
    ctaInquiry: string;
    ctaContact: string;
    stats: { value: string; label: string }[];
    flowTitle: string;
    flowLead: string;
    flowMore: string;
    productTitle: string;
    productLead: string;
    productMore: string;
  };
  process: {
    kicker: string;
    title: string;
    lead: string;
    steps: Step[];
  };
  products: {
    kicker: string;
    title: string;
    lead: string;
    items: Card[];
  };
  compliance: {
    kicker: string;
    title: string;
    lead: string;
    items: Card[];
  };
  about: {
    kicker: string;
    title: string;
    paragraphs: string[];
    points: Card[];
  };
  contact: {
    kicker: string;
    title: string;
    lead: string;
    region: string;
    phone: string;
    email: string;
    address: string;
    inquiryCta: string;
  };
  inquiry: {
    kicker: string;
    title: string;
    lead: string;
    name: string;
    phone: string;
    email: string;
    company: string;
    category: string;
    content: string;
    contentHint: string;
    submit: string;
    submitting: string;
    note: string;
    again: string;
    successTitle: string;
    successBody: string;
    error: string;
    categories: { value: string; label: string }[];
  };
};

const stepsZh: Step[] = [
  { title: '收车登记', body: '登记来源车辆、车型与车主信息，建立一车一档，作为后续验车、结算和拆解的起点。' },
  { title: '验车影像', body: '对车辆外观、铭牌和关键总成拍照留档，核对车况，避免后续交接争议。' },
  { title: '过磅结算', body: '整车过磅、残值议价并完成结算，重量与金额对应到同一台车。' },
  { title: '报废与回收证明', body: '办理报废机动车手续，开具并归档回收证明，区分营运与非营运车辆。' },
  { title: '预处理', body: '抽排油液等危废，完成拆顶等预处理，降低拆解现场的安全与环保风险。' },
  { title: '精细拆解', body: '按总成拆下可再利用配件，记录拆解人员与日期，进入回用件库。' },
  { title: '综合拆解分类', body: '剩余车体综合拆解，按材质分拣为废钢、有色金属、塑料和橡胶。' },
  { title: '回用件入库销售', body: '可用配件检验入库，经审批后销售出库，并保留台账。' },
  { title: '再生材料出库', body: '分类后的再生材料称重、入库并按订单出库，形成闭环。' },
];

const stepsEn: Step[] = [
  { title: 'Vehicle intake', body: 'Register the source vehicle, model, and owner, and open one file per vehicle for inspection, settlement, and dismantling.' },
  { title: 'Inspection images', body: 'Photograph the body, nameplate, and key assemblies so condition is on record before handover.' },
  { title: 'Weighing and settlement', body: 'Weigh the vehicle, agree the residual value, and settle so weight and payment stay on the same record.' },
  { title: 'Scrapping and recycling certificate', body: 'Complete end-of-life formalities and file the recycling certificate, including operating and non-operating vehicles.' },
  { title: 'Pre-treatment', body: 'Drain fluids and other hazardous residues, and complete roof removal before the main dismantling line.' },
  { title: 'Selective dismantling', body: 'Remove reusable assemblies, record who dismantled the vehicle and when, and move parts into the reusable-parts store.' },
  { title: 'Bulk dismantling and sorting', body: 'Dismantle the remaining body and sort scrap steel, non-ferrous metal, plastic, and rubber.' },
  { title: 'Parts warehousing and sales', body: 'Inspect reusable parts into stock, approve sales, and keep a ledger for every outbound shipment.' },
  { title: 'Secondary materials outbound', body: 'Weigh sorted secondary materials, store them, and ship against orders to close the loop.' },
];

export const COPY: Record<Lang, SiteCopy> = {
  zh: {
    brand: '山西华成攒碳汽车拆解',
    brandEn: 'Shanxi Huacheng Zuantan Auto Dismantling',
    tagline: '报废机动车回收 · 规范拆解 · 资源再生',
    nav: {
      home: '首页',
      process: '拆解流程',
      products: '产物与服务',
      compliance: '合规',
      about: '关于我们',
      inquiry: '询价',
      contact: '联系',
    },
    langLabel: 'EN',
    menuOpen: '打开菜单',
    menuClose: '关闭菜单',
    footer: {
      blurb: '面向报废机动车的收购、拆解、回用件与再生材料业务。',
      visit: '栏目',
      staff: '员工入口',
      rights: '山西华成攒碳汽车拆解',
    },
    pending: '资料待补充',
    home: {
      kicker: '山西 · 报废机动车资源化',
      title: '把每一台报废车拆成可追溯的资源',
      lead: '山西华成攒碳汽车拆解覆盖收车、验车、结算、回收证明、预处理、精细拆解、综合分类，直到回用件与再生材料出库。',
      ctaProcess: '查看拆解流程',
      ctaInquiry: '在线询价',
      ctaContact: '联系我们',
      stats: [
        { value: '09', label: '道标准工序' },
        { value: '01', label: '车一档追溯' },
        { value: '02', label: '类产出：回用件与再生料' },
      ],
      flowTitle: '从收车到出库',
      flowLead: '流程与厂内作业一致：先建档，再拆解，最后分类销售。',
      flowMore: '完整九步',
      productTitle: '拆出来的价值',
      productLead: '能用的总成回到维修市场，其余按材质进入再生渠道。',
      productMore: '查看产物',
    },
    process: {
      kicker: '作业链路',
      title: '拆解流程',
      lead: '九步对应厂内从收车到出库的完整路径。每一步都留下车辆、人员和日期，方便追溯。',
      steps: stepsZh,
    },
    products: {
      kicker: '产出',
      title: '产物与服务',
      lead: '服务覆盖报废车接收与拆解，产物分为可再销售配件和分类再生材料。',
      items: [
        { title: '回用件', body: '发动机、变速箱等经检验的总成与配件，入库后按审批销售。' },
        { title: '废钢', body: '车体综合拆解后的钢铁料，分类称重后出库。' },
        { title: '铝件', body: '轮毂、散热器等铝制件单独分拣，避免混入废钢。' },
        { title: '铜', body: '线束与电机中的铜料拆出后单独归集。' },
        { title: '塑料', body: '保险杠、内饰等塑料件按类堆放，进入再生渠道。' },
        { title: '橡胶', body: '轮胎与密封件单独收集，不与金属料混合。' },
      ],
    },
    compliance: {
      kicker: '规范经营',
      title: '合规与环保',
      lead: '回收、拆解和贮存按报废机动车管理要求执行。以下为公开原则，不涉及内部单据字段。',
      items: [
        { title: '资质范围内回收', body: '只接收符合报废机动车回收范围的车辆，并完成来源登记。' },
        { title: '回收证明', body: '办结手续后出具并归档回收证明，营运与非营运车辆分开统计。' },
        { title: '分类贮存', body: '回用件、金属、塑料、橡胶和危废分区存放，避免交叉污染。' },
        { title: '危废单独处置', body: '燃油、机油、制冷剂等在预处理阶段收集，交由有资质单位处置。' },
      ],
    },
    about: {
      kicker: '企业',
      title: '关于山西华成攒碳',
      paragraphs: [
        '山西华成攒碳汽车拆解从事报废机动车回收与拆解，把收车、手续、拆解和销售放在同一条可追溯链路上。',
        '厂内作业区分精细拆解与综合拆解：能继续使用的配件优先拆下，其余车体按材质分类，进入再生材料销售。',
      ],
      points: [
        { title: '一车一档', body: '从登记、影像、过磅到拆解和出库，记录挂在同一台车上。' },
        { title: '先回用，再再生', body: '优先保留可用总成，其余材料按废钢、铝、铜、塑料、橡胶分类。' },
        { title: '手续与生产同步', body: '回收证明和报废手续与验车、拆解进度一起归档。' },
      ],
    },
    contact: {
      kicker: '联络',
      title: '联系我们',
      lead: '业务咨询请通过以下方式联系，或直接提交在线询价，我们会尽快回复。',
      region: '所在地区',
      phone: '电话',
      email: '邮箱',
      address: '地址',
      inquiryCta: '前往在线询价',
    },
    inquiry: {
      kicker: '业务咨询',
      title: '在线询价',
      lead: '填写报废车回收、回用件或再生材料需求，提交后我们会按预留电话与您联系。',
      name: '联系人',
      phone: '联系电话',
      email: '邮箱',
      company: '单位名称',
      category: '询价类型',
      content: '需求说明',
      contentHint: '例如：车型数量、配件品类、材料规格、期望时间等',
      submit: '提交询价',
      submitting: '提交中…',
      note: '仅用于业务跟进，不会用于营销推送。',
      again: '再填一份',
      successTitle: '提交成功',
      successBody: '我们已收到您的询价，会尽快与您联系。',
      error: '提交失败，请稍后重试',
      categories: [
        { value: 'VEHICLE', label: '报废车回收' },
        { value: 'PARTS', label: '回用件采购' },
        { value: 'MATERIAL', label: '再生材料' },
        { value: 'OTHER', label: '其他咨询' },
      ],
    },
  },
  en: {
    brand: 'Shanxi Huacheng Zuantan Auto Dismantling',
    brandEn: '山西华成攒碳汽车拆解',
    tagline: 'End-of-life vehicles · Traceable dismantling · Secondary resources',
    nav: {
      home: 'Home',
      process: 'Process',
      products: 'Outputs',
      compliance: 'Compliance',
      about: 'About',
      inquiry: 'Inquiry',
      contact: 'Contact',
    },
    langLabel: '中文',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    footer: {
      blurb: 'Intake, dismantling, reusable parts, and secondary materials from end-of-life vehicles.',
      visit: 'Sections',
      staff: 'Staff sign-in',
      rights: 'Shanxi Huacheng Zuantan Auto Dismantling',
    },
    pending: 'Details to be updated',
    home: {
      kicker: 'Shanxi · End-of-life vehicle recovery',
      title: 'Every scrapped vehicle becomes a traceable resource',
      lead: 'Shanxi Huacheng Zuantan Auto Dismantling covers intake, inspection, settlement, recycling certificates, pre-treatment, selective and bulk dismantling, through to parts and secondary-material shipments.',
      ctaProcess: 'See the process',
      ctaInquiry: 'Request a quote',
      ctaContact: 'Contact',
      stats: [
        { value: '09', label: 'Standard steps' },
        { value: '01', label: 'File per vehicle' },
        { value: '02', label: 'Output lines: parts and materials' },
      ],
      flowTitle: 'From intake to shipment',
      flowLead: 'The public process matches the yard: open a file, dismantle, then sort and sell.',
      flowMore: 'All nine steps',
      productTitle: 'What comes out',
      productLead: 'Reusable assemblies return to the repair market. The rest moves by material.',
      productMore: 'View outputs',
    },
    process: {
      kicker: 'Operating chain',
      title: 'Dismantling process',
      lead: 'Nine steps follow a vehicle from intake to outbound shipment. Each step keeps the vehicle, the operator, and the date.',
      steps: stepsEn,
    },
    products: {
      kicker: 'Outputs',
      title: 'Outputs and services',
      lead: 'Services cover receiving and dismantling end-of-life vehicles. Outputs split into resale parts and sorted secondary materials.',
      items: [
        { title: 'Reusable parts', body: 'Inspected engines, gearboxes, and other assemblies enter stock and ship after approval.' },
        { title: 'Scrap steel', body: 'Ferrous material from bulk dismantling is weighed by grade before shipment.' },
        { title: 'Aluminum', body: 'Wheels, radiators, and other aluminum parts are sorted apart from steel.' },
        { title: 'Copper', body: 'Copper from harnesses and motors is collected on its own.' },
        { title: 'Plastic', body: 'Bumpers and interior plastics are stacked by type for recycling.' },
        { title: 'Rubber', body: 'Tires and seals are kept separate from metal fractions.' },
      ],
    },
    compliance: {
      kicker: 'Operating rules',
      title: 'Compliance and environment',
      lead: 'Recovery, dismantling, and storage follow end-of-life vehicle requirements. These are public principles, not internal form fields.',
      items: [
        { title: 'Licensed recovery', body: 'Only vehicles within the permitted recovery scope are accepted, and each source is registered.' },
        { title: 'Recycling certificate', body: 'A recycling certificate is issued and filed. Operating and non-operating vehicles are counted separately.' },
        { title: 'Segregated storage', body: 'Parts, metals, plastics, rubber, and hazardous waste stay in separate areas.' },
        { title: 'Hazardous waste', body: 'Fuel, oil, and refrigerant are collected during pre-treatment and sent to licensed handlers.' },
      ],
    },
    about: {
      kicker: 'Company',
      title: 'About Shanxi Huacheng Zuantan',
      paragraphs: [
        'Shanxi Huacheng Zuantan Auto Dismantling recovers and dismantles end-of-life vehicles, keeping intake, paperwork, dismantling, and sales on one traceable chain.',
        'Selective dismantling comes before bulk dismantling: reusable parts are removed first, and the remaining body is sorted into secondary materials.',
      ],
      points: [
        { title: 'One file per vehicle', body: 'Registration, photos, weight, dismantling, and shipments stay on the same vehicle record.' },
        { title: 'Reuse, then recycle', body: 'Sound assemblies are kept. The rest is sorted into steel, aluminum, copper, plastic, and rubber.' },
        { title: 'Paperwork with production', body: 'Recycling certificates and scrapping formalities are filed alongside inspection and dismantling.' },
      ],
    },
    contact: {
      kicker: 'Reach us',
      title: 'Contact',
      lead: 'Use the details below, or submit an online inquiry and we will follow up.',
      region: 'Region',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      inquiryCta: 'Go to inquiry form',
    },
    inquiry: {
      kicker: 'Business enquiry',
      title: 'Request a quote',
      lead: 'Tell us about vehicle recovery, reusable parts, or secondary materials. We will call the number you leave.',
      name: 'Contact name',
      phone: 'Phone',
      email: 'Email',
      company: 'Company',
      category: 'Enquiry type',
      content: 'Requirements',
      contentHint: 'e.g. vehicle count, part types, material specs, preferred timing',
      submit: 'Submit enquiry',
      submitting: 'Submitting…',
      note: 'Used only for business follow-up, not marketing.',
      again: 'Submit another',
      successTitle: 'Submitted',
      successBody: 'We have received your enquiry and will contact you shortly.',
      error: 'Submission failed. Please try again later.',
      categories: [
        { value: 'VEHICLE', label: 'Vehicle recovery' },
        { value: 'PARTS', label: 'Reusable parts' },
        { value: 'MATERIAL', label: 'Secondary materials' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
  },
};

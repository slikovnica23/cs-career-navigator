'use strict';

const LEGACY_985_NAMES = new Set('北京大学、中国人民大学、清华大学、北京航空航天大学、北京理工大学、中国农业大学、北京师范大学、中央民族大学、南开大学、天津大学、大连理工大学、东北大学、吉林大学、哈尔滨工业大学、复旦大学、同济大学、上海交通大学、华东师范大学、南京大学、东南大学、浙江大学、中国科学技术大学、厦门大学、山东大学、中国海洋大学、武汉大学、华中科技大学、湖南大学、中南大学、中山大学、华南理工大学、四川大学、重庆大学、电子科技大学、西安交通大学、西北工业大学、西北农林科技大学、兰州大学、国防科技大学'.split('、'));
// The ministry's historical table has 112 names; mining, petroleum and geology
// each map to two institutions in the 147-institution second-round list.
const LEGACY_211_NAMES = new Set('北京大学、中国人民大学、清华大学、北京交通大学、北京工业大学、北京航空航天大学、北京理工大学、北京科技大学、北京化工大学、北京邮电大学、中国农业大学、北京林业大学、北京中医药大学、北京师范大学、北京外国语大学、中国传媒大学、中央财经大学、对外经济贸易大学、北京体育大学、中央音乐学院、中央民族大学、中国政法大学、华北电力大学、南开大学、天津大学、天津医科大学、河北工业大学、太原理工大学、内蒙古大学、辽宁大学、大连理工大学、东北大学、大连海事大学、吉林大学、延边大学、东北师范大学、哈尔滨工业大学、哈尔滨工程大学、东北农业大学、东北林业大学、复旦大学、同济大学、上海交通大学、华东理工大学、东华大学、华东师范大学、上海外国语大学、上海财经大学、上海大学、第二军医大学、南京大学、苏州大学、东南大学、南京航空航天大学、南京理工大学、中国矿业大学、河海大学、江南大学、南京农业大学、中国药科大学、南京师范大学、浙江大学、安徽大学、中国科学技术大学、合肥工业大学、厦门大学、福州大学、南昌大学、山东大学、中国海洋大学、中国石油大学、郑州大学、武汉大学、华中科技大学、中国地质大学、武汉理工大学、华中农业大学、华中师范大学、中南财经政法大学、湖南大学、中南大学、湖南师范大学、国防科学技术大学、中山大学、暨南大学、华南理工大学、华南师范大学、广西大学、海南大学、四川大学、西南交通大学、电子科技大学、四川农业大学、西南财经大学、重庆大学、西南大学、贵州大学、云南大学、西藏大学、西北大学、西安交通大学、西北工业大学、西安电子科技大学、长安大学、西北农林科技大学、陕西师范大学、第四军医大学、兰州大学、青海大学、宁夏大学、新疆大学、石河子大学'.split('、'));
const UNIVERSITY_LEGACY_NAMES = {
  '中国矿业大学（北京）':'中国矿业大学',
  '中国石油大学（华东）':'中国石油大学', '中国石油大学（北京）':'中国石油大学',
  '中国地质大学（武汉）':'中国地质大学', '中国地质大学（北京）':'中国地质大学',
  '国防科技大学':'国防科学技术大学', '海军军医大学':'第二军医大学', '空军军医大学':'第四军医大学'
};
const UNIVERSITY_ALIASES = {
  '上海体育大学':['上海体育学院'],
  '国防科技大学':['国防科学技术大学'],
  '海军军医大学':['第二军医大学'], '空军军医大学':['第四军医大学'],
  '中国矿业大学':['中国矿业大学（徐州）'],
  '华北电力大学':['华北电力大学（北京）','华北电力大学（保定）']
};
// Fourth-round evaluation (2017) of the 0812 Computer Science and Technology
// first-level discipline. Only institutions in the published table are listed.
// "中国地质大学" and "中国石油大学" map to the Wuhan and Beijing campuses
// respectively, matching the institution codes in the published table.
const UNIVERSITY_CS_EVALUATION = {
  'A+': ['北京大学','清华大学','浙江大学','国防科技大学'],
  'A': ['北京航空航天大学','北京邮电大学','哈尔滨工业大学','上海交通大学','南京大学','华中科技大学','电子科技大学'],
  'A-': ['北京交通大学','北京理工大学','东北大学','吉林大学','同济大学','中国科学技术大学','武汉大学','中南大学','西安交通大学','西北工业大学','西安电子科技大学'],
  'B+': ['中国人民大学','北京工业大学','北京科技大学','南开大学','天津大学','大连理工大学','哈尔滨工程大学','复旦大学','华东师范大学','东南大学','南京航空航天大学','南京理工大学','合肥工业大学','厦门大学','山东大学','湖南大学','中山大学','华南理工大学','四川大学','重庆大学','西南交通大学'],
  'B': ['北京师范大学','山西大学','大连海事大学','华东理工大学','上海大学','苏州大学','中国矿业大学','河海大学','南京信息工程大学','安徽大学','中国海洋大学','中国地质大学（武汉）','武汉理工大学','暨南大学','西南大学','兰州大学'],
  'B-': ['中国农业大学','首都师范大学','天津工业大学','华北电力大学','太原理工大学','内蒙古大学','东华大学','南京邮电大学','江南大学','福州大学','中国石油大学（北京）','华中师范大学','广西大学','云南大学','西北大学','新疆大学'],
  'C+': ['北京化工大学','中国传媒大学','河北工业大学','上海海洋大学','南昌大学','郑州大学','贵州大学','长安大学'],
  'C': ['湘潭大学','华南农业大学','西北农林科技大学'],
  'C-': ['中央民族大学','河南大学','海南大学','西南石油大学','西南财经大学']
};
const UNIVERSITY_CATALOG_SOURCES = [
  {title:'教育部：第二轮“双一流”建设名单通知（2022）',url:'https://www.moe.gov.cn/srcsite/A22/s7065/202202/t20220211_598710.html'},
  {title:'教育部：原“985工程”学校名单',url:'https://www.moe.gov.cn/srcsite/A22/s7065/200612/t20061206_128833.html'},
  {title:'教育部：原“211工程”学校名单',url:'https://www.moe.gov.cn/srcsite/A22/s7065/200512/t20051223_82762.html'},
  {title:'政府网站附件：第二轮名单复核副本',url:'https://www.12371.gov.cn/stacteresource/30061/ORIGINAL/MEDIA/DOCUMENT/2026/2/27/fc90e94bb2334527a6321e35d984c7e6.pdf'},
  {title:'教育部：上海体育学院更名为上海体育大学',url:'https://www.moe.gov.cn/srcsite/A03/s181/202306/t20230616_1064609.html'}
];
const UNIVERSITY_EVALUATION_SOURCES = [
  {title:'教育部：全国第四轮学科评估结果发布（2017）',url:'https://www.moe.gov.cn/jyb_xwfb/s5147/201712/t20171229_323332.html'},
  {title:'0812 计算机科学与技术分档结果（完整表）',url:'https://gaokao.eol.cn/daxue/zixun/201712/t20171228_1577057.shtml'},
  {title:'吉林大学计算机科学与技术学院：第四轮评估附件入口',url:'https://ccst.jlu.edu.cn/info/1091/6641.htm'}
];

// name, main-campus province, university website, graduate entry, resource ID, entry review method
const MAINLAND_UNIVERSITY_ROWS = [["北京大学","北京市","https://www.pku.edu.cn/","https://admission.pku.edu.cn/","pkuadmissions","existing"],
  ["中国人民大学","北京市","https://www.ruc.edu.cn/","https://pgs.ruc.edu.cn/","university-cn-002","official-page"],
  ["清华大学","北京市","https://www.tsinghua.edu.cn/","https://yz.tsinghua.edu.cn/","tsinghuaadmissions","existing"],
  ["北京交通大学","北京市","https://www.bjtu.edu.cn/","https://gs.bjtu.edu.cn/","university-cn-004","official-page"],
  ["北京工业大学","北京市","https://www.bjut.edu.cn/","https://yanzhao.bjut.edu.cn/","university-cn-005","official-page"],
  ["北京航空航天大学","北京市","https://www.buaa.edu.cn/","https://yzb.buaa.edu.cn/","university-cn-006","official-page"],
  ["北京理工大学","北京市","https://www.bit.edu.cn/","https://grd.bit.edu.cn/zsgz/bsyjs/gzzd/index.htm","bitadmissions","existing"],
  ["北京科技大学","北京市","https://www.ustb.edu.cn/","https://yzxc.ustb.edu.cn/","university-cn-008","official-page"],
  ["北京化工大学","北京市","https://www.buct.edu.cn/","https://graduate.buct.edu.cn/","university-cn-009","official-page"],
  ["北京邮电大学","北京市","https://www.bupt.edu.cn/","https://yzb.bupt.edu.cn/","buptadmissions","existing"],
  ["中国农业大学","北京市","https://www.cau.edu.cn/","https://yz.cau.edu.cn/","university-cn-011","official-page"],
  ["北京林业大学","北京市","https://www.bjfu.edu.cn/","","university-cn-012","university-home"],
  ["北京协和医学院","北京市","https://www.pumc.edu.cn/","https://graduate.pumc.edu.cn/","university-cn-013","official-page"],
  ["北京中医药大学","北京市","https://www.bucm.edu.cn/","https://yanjiusheng.bucm.edu.cn/zsjy/zsjz/index.htm","university-cn-014","official-page"],
  ["北京师范大学","北京市","https://www.bnu.edu.cn/","https://yz.bnu.edu.cn/","university-cn-015","official-page"],
  ["首都师范大学","北京市","https://www.cnu.edu.cn/","","university-cn-016","university-home"],
  ["北京外国语大学","北京市","https://www.bfsu.edu.cn/","https://graduate.bfsu.edu.cn/","university-cn-017","official-page"],
  ["中国传媒大学","北京市","https://www.cuc.edu.cn/","https://yz.cuc.edu.cn/","university-cn-018","official-index"],
  ["中央财经大学","北京市","https://www.cufe.edu.cn/","https://gs.cufe.edu.cn/","university-cn-019","official-page"],
  ["对外经济贸易大学","北京市","https://www.uibe.edu.cn/","https://yjsy.uibe.edu.cn/cms/index.do","university-cn-020","official-index"],
  ["外交学院","北京市","https://www.cfau.edu.cn/","https://yjsb.cfau.edu.cn/","university-cn-021","official-page"],
  ["中国人民公安大学","北京市","https://www.ppsuc.edu.cn/","https://yzb.ppsuc.edu.cn/","university-cn-022","official-index"],
  ["北京体育大学","北京市","https://www.bsu.edu.cn/","https://grs.bsu.edu.cn/","university-cn-023","official-page"],
  ["中央音乐学院","北京市","https://www.ccom.edu.cn/","https://www.ccom.edu.cn/jgk/jxkygldw/ysjb/zxxx/bszs/35.htm","university-cn-024","official-page"],
  ["中国音乐学院","北京市","https://www.ccmusic.edu.cn/","https://yjsy.ccmusic.edu.cn/","university-cn-025","official-page"],
  ["中央美术学院","北京市","https://www.cafa.edu.cn/","https://yz.cafa.edu.cn/","university-cn-026","official-index"],
  ["中央戏剧学院","北京市","https://www.chntheatre.edu.cn/","https://www.chntheatre.edu.cn/cn/recruit/boshi.html","university-cn-027","official-page"],
  ["中央民族大学","北京市","https://www.muc.edu.cn/","https://grs.muc.edu.cn/yjsyzsw/","university-cn-028","official-page"],
  ["中国政法大学","北京市","https://www.cupl.edu.cn/","https://yjsy.cupl.edu.cn/","university-cn-029","official-index"],
  ["南开大学","天津市","https://www.nankai.edu.cn/","https://yzb.nankai.edu.cn/","nankaiadmissions","existing"],
  ["天津大学","天津市","https://www.tju.edu.cn/","https://yzb.tju.edu.cn/","tjuadmissions","existing"],
  ["天津工业大学","天津市","https://www.tiangong.edu.cn/","https://yjsb.tiangong.edu.cn/","university-cn-032","official-page"],
  ["天津医科大学","天津市","https://www.tmu.edu.cn/","https://gs.tmu.edu.cn/","university-cn-033","official-index"],
  ["天津中医药大学","天津市","https://www.tjutcm.edu.cn/","https://yjsy.tjutcm.edu.cn/","university-cn-034","official-index"],
  ["华北电力大学","北京市","https://www.ncepu.edu.cn/","https://yjsy.ncepu.edu.cn/","university-cn-035","official-page"],
  ["河北工业大学","天津市","https://www.hebut.edu.cn/","https://yjs.hebut.edu.cn/","university-cn-036","official-page"],
  ["山西大学","山西省","https://www.sxu.edu.cn/","https://yjszsw.sxu.edu.cn/","university-cn-037","official-page"],
  ["太原理工大学","山西省","https://www.tyut.edu.cn/","https://www.gs.tyut.edu.cn/zsgz/bszs/zsjz.htm","university-cn-038","official-index"],
  ["内蒙古大学","内蒙古自治区","https://www.imu.edu.cn/","https://gs.imu.edu.cn/","university-cn-039","official-page"],
  ["辽宁大学","辽宁省","https://www.lnu.edu.cn/","https://grs.lnu.edu.cn/","university-cn-040","official-page"],
  ["大连理工大学","辽宁省","https://www.dlut.edu.cn/","https://gs.dlut.edu.cn/","university-cn-041","official-page"],
  ["东北大学","辽宁省","https://www.neu.edu.cn/","https://yz.neu.edu.cn/","university-cn-042","official-page"],
  ["大连海事大学","辽宁省","https://www.dlmu.edu.cn/","https://grs.dlmu.edu.cn/","university-cn-043","official-page"],
  ["吉林大学","吉林省","https://www.jlu.edu.cn/","https://yzb.jlu.edu.cn/index.htm","university-cn-044","official-page"],
  ["延边大学","吉林省","https://www.ybu.edu.cn/","https://grad.ybu.edu.cn/","university-cn-045","official-index"],
  ["东北师范大学","吉林省","https://www.nenu.edu.cn/","https://yjsy.nenu.edu.cn/","university-cn-046","official-page"],
  ["哈尔滨工业大学","黑龙江省","https://www.hit.edu.cn/","https://yzb.hit.edu.cn/","hitadmissions","existing"],
  ["哈尔滨工程大学","黑龙江省","https://www.hrbeu.edu.cn/","https://yzb.hrbeu.edu.cn/","university-cn-048","official-page"],
  ["东北农业大学","黑龙江省","https://www.neau.edu.cn/","https://graduate.neau.edu.cn/","university-cn-049","official-index"],
  ["东北林业大学","黑龙江省","https://www.nefu.edu.cn/","https://yz.nefu.edu.cn/bsszs.htm","university-cn-050","official-page"],
  ["复旦大学","上海市","https://www.fudan.edu.cn/","https://gsao.fudan.edu.cn/","fudanadmissions","existing"],
  ["同济大学","上海市","https://www.tongji.edu.cn/","https://yz.tongji.edu.cn/","university-cn-052","official-page"],
  ["上海交通大学","上海市","https://www.sjtu.edu.cn/","https://yzb.sjtu.edu.cn/","sjtuadmissions","existing"],
  ["华东理工大学","上海市","https://www.ecust.edu.cn/","https://gschool.ecust.edu.cn/","university-cn-054","official-page"],
  ["东华大学","上海市","https://www.dhu.edu.cn/","https://yjszs.dhu.edu.cn/","university-cn-055","official-page"],
  ["上海海洋大学","上海市","https://www.shou.edu.cn/","https://yjs.shou.edu.cn/","university-cn-056","official-index"],
  ["上海中医药大学","上海市","https://www.shutcm.edu.cn/","https://yjsy.shutcm.edu.cn/","university-cn-057","official-index"],
  ["华东师范大学","上海市","https://www.ecnu.edu.cn/","https://yjszs.ecnu.edu.cn/","university-cn-058","official-index"],
  ["上海外国语大学","上海市","https://www.shisu.edu.cn/","https://graduate.shisu.edu.cn/","university-cn-059","official-page"],
  ["上海财经大学","上海市","https://www.sufe.edu.cn/","https://gs.sufe.edu.cn/","university-cn-060","official-page"],
  ["上海体育大学","上海市","https://www.sus.edu.cn/","","university-cn-061","university-home"],
  ["上海音乐学院","上海市","https://www.shcmusic.edu.cn/","https://yjsb.shcmusic.edu.cn/","university-cn-062","official-index"],
  ["上海大学","上海市","https://www.shu.edu.cn/","https://yjszs.shu.edu.cn/","university-cn-063","official-page"],
  ["南京大学","江苏省","https://www.nju.edu.cn/","https://yzb.nju.edu.cn/main.htm","njuadmissions","existing"],
  ["苏州大学","江苏省","https://www.suda.edu.cn/","https://yjs.suda.edu.cn/","university-cn-065","official-page"],
  ["东南大学","江苏省","https://www.seu.edu.cn/","https://yzb.seu.edu.cn/6677/list.htm","seuadmissions","existing"],
  ["南京航空航天大学","江苏省","https://www.nuaa.edu.cn/","https://www.graduate.nuaa.edu.cn/","university-cn-067","official-page"],
  ["南京理工大学","江苏省","https://www.njust.edu.cn/","https://gs.njust.edu.cn/","university-cn-068","official-page"],
  ["中国矿业大学","江苏省","https://www.cumt.edu.cn/","https://yz.cumt.edu.cn/","university-cn-069","official-page"],
  ["南京邮电大学","江苏省","https://www.njupt.edu.cn/","https://yzb.njupt.edu.cn/","university-cn-070","official-page"],
  ["河海大学","江苏省","https://www.hhu.edu.cn/","https://gs.hhu.edu.cn/","university-cn-071","official-page"],
  ["江南大学","江苏省","https://www.jiangnan.edu.cn/","https://gs.jiangnan.edu.cn/","university-cn-072","official-page"],
  ["南京林业大学","江苏省","https://www.njfu.edu.cn/","https://yz.njfu.edu.cn/bszs/","university-cn-073","official-page"],
  ["南京信息工程大学","江苏省","https://www.nuist.edu.cn/","https://yjs.nuist.edu.cn/","university-cn-074","official-index"],
  ["南京农业大学","江苏省","https://www.njau.edu.cn/","https://grasch.njau.edu.cn/","university-cn-075","official-page"],
  ["南京医科大学","江苏省","https://www.njmu.edu.cn/","https://yjszs.njmu.edu.cn/","university-cn-076","official-page"],
  ["南京中医药大学","江苏省","https://www.njucm.edu.cn/","https://gra.njucm.edu.cn/","university-cn-077","official-page"],
  ["中国药科大学","江苏省","https://www.cpu.edu.cn/","https://yjsy.cpu.edu.cn/","university-cn-078","official-page"],
  ["南京师范大学","江苏省","https://www.nnu.edu.cn/","https://grad.njnu.edu.cn/","university-cn-079","official-index"],
  ["浙江大学","浙江省","https://www.zju.edu.cn/","https://www.grs.zju.edu.cn/yjszs/","zjuadmissions","existing"],
  ["中国美术学院","浙江省","https://www.caa.edu.cn/","https://zb.caa.edu.cn/","university-cn-081","official-page"],
  ["安徽大学","安徽省","https://www.ahu.edu.cn/","https://yz.ahu.edu.cn/","university-cn-082","official-index"],
  ["中国科学技术大学","安徽省","https://www.ustc.edu.cn/","https://yz.ustc.edu.cn/","ustcadmissions","existing"],
  ["合肥工业大学","安徽省","https://www.hfut.edu.cn/","https://yjszs.hfut.edu.cn/","university-cn-084","official-page"],
  ["厦门大学","福建省","https://www.xmu.edu.cn/","https://zs.xmu.edu.cn/","university-cn-085","official-page"],
  ["福州大学","福建省","https://www.fzu.edu.cn/","https://yjsy.fzu.edu.cn/","university-cn-086","official-page"],
  ["南昌大学","江西省","https://www.ncu.edu.cn/","https://yjsy.ncu.edu.cn/","university-cn-087","official-page"],
  ["山东大学","山东省","https://www.sdu.edu.cn/","https://www.yz.sdu.edu.cn/","university-cn-088","official-page"],
  ["中国海洋大学","山东省","https://www.ouc.edu.cn/","https://yz.ouc.edu.cn/","university-cn-089","official-index"],
  ["中国石油大学（华东）","山东省","https://www.upc.edu.cn/","https://gs.upc.edu.cn/","university-cn-090","official-page"],
  ["郑州大学","河南省","https://www.zzu.edu.cn/","https://gs.zzu.edu.cn/","university-cn-091","official-page"],
  ["河南大学","河南省","https://www.henu.edu.cn/","https://grs.henu.edu.cn/","university-cn-092","official-index"],
  ["武汉大学","湖北省","https://www.whu.edu.cn/","https://wdyz.whu.edu.cn/","whuadmissions","existing"],
  ["华中科技大学","湖北省","https://www.hust.edu.cn/","https://gszs.hust.edu.cn/","hustadmissions","existing"],
  ["中国地质大学（武汉）","湖北省","https://www.cug.edu.cn/","https://yz.cug.edu.cn/","university-cn-095","official-page"],
  ["武汉理工大学","湖北省","https://www.whut.edu.cn/","https://gd.whut.edu.cn/","university-cn-096","official-index"],
  ["华中农业大学","湖北省","https://www.hzau.edu.cn/","https://yjs.hzau.edu.cn/","university-cn-097","official-page"],
  ["华中师范大学","湖北省","https://www.ccnu.edu.cn/","https://gs.ccnu.edu.cn/","university-cn-098","official-index"],
  ["中南财经政法大学","湖北省","https://www.zuel.edu.cn/","https://yjsy.zuel.edu.cn/","university-cn-099","official-index"],
  ["湘潭大学","湖南省","https://www.xtu.edu.cn/","https://yjsc.xtu.edu.cn/","university-cn-100","official-page"],
  ["湖南大学","湖南省","https://www.hnu.edu.cn/","https://gra.hnu.edu.cn/","university-cn-101","official-page"],
  ["中南大学","湖南省","https://www.csu.edu.cn/","https://gra.csu.edu.cn/","university-cn-102","official-page"],
  ["湖南师范大学","湖南省","https://www.hunnu.edu.cn/","https://yjsy.hunnu.edu.cn/","university-cn-103","official-page"],
  ["中山大学","广东省","https://www.sysu.edu.cn/","https://graduate.sysu.edu.cn/zsw/doctor","sysuadmissions","existing"],
  ["暨南大学","广东省","https://www.jnu.edu.cn/","https://yz.jnu.edu.cn/","university-cn-105","official-page"],
  ["华南理工大学","广东省","https://www.scut.edu.cn/","https://yz.scut.edu.cn/","university-cn-106","official-page"],
  ["华南农业大学","广东省","https://www.scau.edu.cn/","https://yjsy.scau.edu.cn/","university-cn-107","official-page"],
  ["广州医科大学","广东省","https://www.gzhmu.edu.cn/","https://yjs.gzhmu.edu.cn/","university-cn-108","official-index"],
  ["广州中医药大学","广东省","https://www.gzucm.edu.cn/","https://yjsy.gzucm.edu.cn/","university-cn-109","official-index"],
  ["华南师范大学","广东省","https://www.scnu.edu.cn/","https://yz.scnu.edu.cn/","university-cn-110","official-page"],
  ["海南大学","海南省","https://www.hainanu.edu.cn/","https://gs.hainanu.edu.cn/yjszs/bsszs.htm","university-cn-111","official-page"],
  ["广西大学","广西壮族自治区","https://www.gxu.edu.cn/","https://yjsc.gxu.edu.cn/","university-cn-112","official-page"],
  ["四川大学","四川省","https://www.scu.edu.cn/","https://yz.scu.edu.cn/","university-cn-113","official-page"],
  ["重庆大学","重庆市","https://www.cqu.edu.cn/","https://graduate.cqu.edu.cn/","university-cn-114","official-index"],
  ["西南交通大学","四川省","https://www.swjtu.edu.cn/","https://yz.swjtu.edu.cn/","university-cn-115","official-page"],
  ["电子科技大学","四川省","https://www.uestc.edu.cn/","https://yz.uestc.edu.cn/","uestcadmissions","existing"],
  ["西南石油大学","四川省","https://www.swpu.edu.cn/","https://www.swpu.edu.cn/gs/","university-cn-117","official-page"],
  ["成都理工大学","四川省","https://www.cdut.edu.cn/","https://gra.cdut.edu.cn/index.htm","university-cn-118","official-index"],
  ["四川农业大学","四川省","https://www.sicau.edu.cn/","https://yan.sicau.edu.cn/","university-cn-119","official-page"],
  ["成都中医药大学","四川省","https://www.cdutcm.edu.cn/","","university-cn-120","university-home"],
  ["西南大学","重庆市","https://www.swu.edu.cn/","https://yz.swu.edu.cn/","university-cn-121","official-page"],
  ["西南财经大学","四川省","https://www.swufe.edu.cn/","https://yz.swufe.edu.cn/","university-cn-122","official-page"],
  ["贵州大学","贵州省","https://www.gzu.edu.cn/","https://gs.gzu.edu.cn/","university-cn-123","official-index"],
  ["云南大学","云南省","https://www.ynu.edu.cn/","","university-cn-124","university-home"],
  ["西藏大学","西藏自治区","https://www.utibet.edu.cn/","https://yjszs.utibet.edu.cn/","university-cn-125","official-index"],
  ["西北大学","陕西省","https://www.nwu.edu.cn/","https://yjs.nwu.edu.cn/","university-cn-126","official-page"],
  ["西安交通大学","陕西省","https://www.xjtu.edu.cn/","https://yz.xjtu.edu.cn/","xjtuadmissions","existing"],
  ["西北工业大学","陕西省","https://www.nwpu.edu.cn/","https://yzb.nwpu.edu.cn/","university-cn-128","official-page"],
  ["西安电子科技大学","陕西省","https://www.xidian.edu.cn/","https://gr.xidian.edu.cn/","xidianadmissions","existing"],
  ["长安大学","陕西省","https://www.chd.edu.cn/","https://yzb.chd.edu.cn/","university-cn-130","official-page"],
  ["西北农林科技大学","陕西省","https://www.nwsuaf.edu.cn/","https://yz.nwsuaf.edu.cn/wbtlm/index.htm","university-cn-131","official-page"],
  ["陕西师范大学","陕西省","https://www.snnu.edu.cn/","https://yz.snnu.edu.cn/","university-cn-132","official-page"],
  ["兰州大学","甘肃省","https://www.lzu.edu.cn/","https://ge.lzu.edu.cn/","university-cn-133","official-page"],
  ["青海大学","青海省","https://www.qhu.edu.cn/","https://yjs.qhu.edu.cn/","university-cn-134","official-page"],
  ["宁夏大学","宁夏回族自治区","https://www.nxu.edu.cn/","https://graduate.nxu.edu.cn/","university-cn-135","official-page"],
  ["新疆大学","新疆维吾尔自治区","https://www.xju.edu.cn/","https://gs.xju.edu.cn/","university-cn-136","official-page"],
  ["石河子大学","新疆维吾尔自治区","https://www.shzu.edu.cn/","https://yz.shzu.edu.cn/","university-cn-137","official-page"],
  ["中国矿业大学（北京）","北京市","https://www.cumtb.edu.cn/","https://yjs.cumtb.edu.cn/","university-cn-138","official-page"],
  ["中国石油大学（北京）","北京市","https://www.cup.edu.cn/","https://grs.cup.edu.cn/zsbstzgg/index.jhtml","university-cn-139","official-page"],
  ["中国地质大学（北京）","北京市","https://www.cugb.edu.cn/","https://bm.cugb.edu.cn/yjsyzsb/zsxx/bszs/","university-cn-140","official-page"],
  ["宁波大学","浙江省","https://www.nbu.edu.cn/","https://graduate.nbu.edu.cn/","university-cn-141","official-page"],
  ["南方科技大学","广东省","https://www.sustech.edu.cn/","https://gs.sustech.edu.cn/","sustechadmissions","existing"],
  ["上海科技大学","上海市","https://www.shanghaitech.edu.cn/","https://yanzhao.shanghaitech.edu.cn/","university-cn-143","official-page"],
  ["中国科学院大学","北京市","https://www.ucas.ac.cn/","https://admission.ucas.ac.cn/","ucasadmissions","existing"],
  ["国防科技大学","湖南省","https://www.nudt.edu.cn/","https://yjszs.nudt.edu.cn/","university-cn-145","official-index"],
  ["海军军医大学","上海市","https://www.smmu.edu.cn/","https://ao.smmu.edu.cn/","university-cn-146","official-index"],
  ["空军军医大学","陕西省","https://www.fmmu.edu.cn/","https://www.fmmu.edu.cn/yjsy/","university-cn-147","official-page"]];


const UNIVERSITY_ENTRY_METHODS = {
  'official-page': '已读取官方研究生页面',
  'official-index': '官方检索资料核对；直接读取受限或内容不足',
  'university-home': '学校官网导航；博士招生栏目待核对',
  'existing': '沿用已收录的官方入口及卡片核对提示'
};
const UNIVERSITY_CS_GRADES = Object.fromEntries(Object.entries(UNIVERSITY_CS_EVALUATION)
  .flatMap(([grade, names]) => names.map(name => [name, grade])));
window.CS_DATA.universityCatalog = {
  round: '第二轮（2022）', reviewedOn: '2026-10-21', sources: UNIVERSITY_CATALOG_SOURCES,
  evaluation: {
    round: '第四轮（2017）', discipline: '计算机科学与技术', code: '0812',
    publishedEntries: 168, matchedEntries: Object.keys(UNIVERSITY_CS_GRADES).length,
    sources: UNIVERSITY_EVALUATION_SOURCES
  },
  entries: []
};
for (const [name, province, website, graduateEntry, resourceId, reviewMethod] of MAINLAND_UNIVERSITY_ROWS) {
  const legacyName = UNIVERSITY_LEGACY_NAMES[name] || name;
  const groups = ['double-first'];
  const labels = ['双一流（第二轮）'];
  if (LEGACY_985_NAMES.has(name)) { groups.push('985'); labels.push('原985'); }
  if (LEGACY_211_NAMES.has(legacyName)) { groups.push('211'); labels.push('原211'); }
  const aliases = UNIVERSITY_ALIASES[name] || [];
  const military = ['国防科技大学','海军军医大学','空军军医大学'].includes(name);
  const note = name === '华北电力大学' ? '北京、保定校区合并为一条；所在地按北京主校区。'
    : name === '河北工业大学' ? '河北省属高校，主校区位于天津；所在地筛选按天津。'
    : name === '上海体育大学' ? '第二轮原名单名为上海体育学院，现名依据教育部更名函。'
    : military ? '军队院校：优先核对报考身份、招生对象及专项资格。' : '';
  const school = { name, province, website, groups, labels, aliases, note,
    csGrade: UNIVERSITY_CS_GRADES[name] || '',
    entryKind: graduateEntry ? '研究生官方入口' : '学校官网导航',
    verification: UNIVERSITY_ENTRY_METHODS[reviewMethod], reviewMethod };
  let resource = window.CS_DATA.resources.find(item => item.id === resourceId);
  if (!resource) {
    resource = { id: resourceId, name: `${name} · ${school.entryKind}`, url: graduateEntry || website,
      scope: 'phd', cat: '院校官方招生', region: '中国大陆', kind: '官方平台', priority: 2,
      summary: graduateEntry ? `${name}的研究生官方入口，用于查博士目录、招生通知和院系信息。` : `${name}学校官网；从研究生教育或招生栏目查博士信息。`,
      action: '先查当届是否设置计算机、软件、网安或相关交叉方向博士，再核对院系、导师与报考资格。',
      output: '当届专业目录、学位类型、导师方向、院系细则及申请节点对照表。',
      warning: '名单标签不代表计算机学科入选、设有相关博士点或当批有名额。' + (reviewMethod === 'official-index' ? '本次直接读取受限或内容不足，入口由官方检索资料核对，请在浏览器复核。' : reviewMethod === 'university-home' ? '仅收录学校官网导航，未确认博士招生栏目；请从校内链接继续核查。' : '具体资格及时间以当届招生通知为准。'),
      reviewedOn: '2026-10-21' };
    window.CS_DATA.resources.push(resource);
  }
  resource.school = school;
  window.CS_DATA.universityCatalog.entries.push({ resourceId, ...school });
}
window.CS_DATA.contentSources.push(...UNIVERSITY_CATALOG_SOURCES.map(source => ({...source, scope:'phd'})));
window.CS_DATA.contentSources.push(...UNIVERSITY_EVALUATION_SOURCES.map(source => ({...source, scope:'phd'})));

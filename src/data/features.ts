// 우리(샤오미·레드미·포코) 제품의 기능 지원 여부를 O/X로 정리한 표. login-demo.html 추출
// 파이프라인과는 별개로, mi.com/kr 공식 스펙 페이지를 직접 조사해 손으로 정리했다(2026.10 조사).
// 애매하거나 매장에서 혼동하기 쉬운 항목은 O/X 대신 짧은 설명을 넣고, notes에 보충 설명을 둔다.
import type { FeatureGroup } from "@/types/product";

export const FEATURES: Record<string, FeatureGroup> = {
  phone: {
    label: "스마트폰",
    features: [
      { id: "nfc", label: "NFC" },
      { id: "wireless", label: "무선충전" },
      { id: "sd", label: "SD카드" },
      { id: "jack", label: "이어폰잭" },
      { id: "ip", label: "방수" },
    ],
    rows: [
      {
        n: "포코 M8 5G",
        x: true,
        values: { nfc: "O", wireless: "X", sd: "O(하이브리드)", jack: "X", ip: "IP66" },
      },
      {
        n: "레드미 노트14 프로 5G",
        x: true,
        values: { nfc: "O", wireless: "X", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "포코 X8 프로",
        x: true,
        values: { nfc: "O", wireless: "X", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "포코 X8 프로 맥스",
        x: true,
        values: { nfc: "O", wireless: "X", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "샤오미 15T 프로",
        x: true,
        values: { nfc: "O", wireless: "O(50W)", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "샤오미 15",
        x: true,
        values: { nfc: "O", wireless: "O(50W)", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "샤오미 17T",
        x: true,
        values: { nfc: "O", wireless: "X", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "샤오미 17",
        x: true,
        values: { nfc: "O", wireless: "O(50W)", sd: "X", jack: "X", ip: "IP68" },
      },
      {
        n: "샤오미 17 울트라",
        x: true,
        values: { nfc: "O", wireless: "O(50W)", sd: "X", jack: "X", ip: "IP68*" },
      },
      {
        n: "아이폰 13·13 미니·13 프로·13 프로맥스",
        x: false,
        values: { nfc: "O", wireless: "O(MagSafe)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "아이폰 14·14 Plus·14 프로·14 프로맥스",
        x: false,
        values: { nfc: "O", wireless: "O(MagSafe)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "아이폰 15·15 Plus·15 프로·15 프로맥스",
        x: false,
        values: { nfc: "O", wireless: "O(MagSafe·Qi2)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "아이폰 16·16 Plus·16 프로·16 프로맥스",
        x: false,
        values: { nfc: "O", wireless: "O(MagSafe·Qi2)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "아이폰 16e",
        x: false,
        values: { nfc: "O", wireless: "O(Qi 7.5W, MagSafe 없음**)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "아이폰 17·17 프로·17 프로맥스·17e·18 프로·18 프로맥스",
        x: false,
        values: { nfc: "O", wireless: "O(MagSafe·Qi2)", sd: "X", jack: "X", ip: "IP68(6m/30분)" },
      },
      {
        n: "갤럭시 S23·S23+·S23 울트라·S23 FE",
        x: false,
        values: { nfc: "O", wireless: "O(역충전 PowerShare)", sd: "X", jack: "X", ip: "IP68(1.5m/30분)" },
      },
      {
        n: "갤럭시 S24·S24+·S24 울트라·S24 FE",
        x: false,
        values: { nfc: "O", wireless: "O(역충전 PowerShare)", sd: "X", jack: "X", ip: "IP68(1.5m/30분)" },
      },
      {
        n: "갤럭시 S25·S25+·S25 울트라·S25 FE",
        x: false,
        values: { nfc: "O", wireless: "O(역충전 PowerShare)", sd: "X", jack: "X", ip: "IP68(1.5m/30분)" },
      },
      {
        n: "갤럭시 S26·S26+·S26 울트라·S26 FE",
        x: false,
        values: { nfc: "O", wireless: "O(역충전 PowerShare)", sd: "X", jack: "X", ip: "IP68(1.5m/30분)" },
      },
      {
        n: "갤럭시 A35",
        x: false,
        values: { nfc: "O", wireless: "X", sd: "O(하이브리드)", jack: "X", ip: "IP67(1m/30분)" },
      },
      {
        n: "갤럭시 퀀텀5 (A55)***",
        x: false,
        values: { nfc: "O", wireless: "X", sd: "O(하이브리드)", jack: "X", ip: "IP67(1m/30분)" },
      },
    ],
    notes: [
      "포코 M8 5G·갤럭시 A35·갤럭시 퀀텀5(A55)의 SD카드는 듀얼심과 겸용되는 하이브리드 슬롯이라, SD카드를 쓰려면 유심 하나를 포기해야 해요.",
      "* 샤오미 17 울트라는 본체만 IP68이고, 촬영 그립 액세서리를 끼우면 그립+폰 조합 등급이 IP54로 낮아져요.",
      "** 아이폰 16e만 MagSafe 자석이 없어서 일반 Qi 충전기에서만(최대 7.5W) 무선충전돼요. 16e 앞뒤로는(13~18 프로맥스까지) 전부 MagSafe 지원.",
      "*** '퀀텀5'는 SKT 전용 명칭이에요. KT·LG U+·자급제로 파는 같은 기기는 그냥 '갤럭시 A55 5G'로 불려요.",
      "레드미 노트14 프로 5G(매장 판매 모델, 5G)는 이어폰잭이 없어요(X) — 잭이 있는 건 국내에 안 들어오는 4G 모델이라 혼동하기 쉬우니 주의하세요.",
    ],
  },
  tablet: {
    label: "태블릿",
    features: [
      { id: "nfc", label: "NFC" },
      { id: "wireless", label: "무선충전" },
      { id: "sd", label: "SD카드" },
      { id: "jack", label: "이어폰잭" },
      { id: "ip", label: "방수" },
      { id: "pen", label: "펜" },
      { id: "cell", label: "유심 모델" },
    ],
    rows: [
      {
        n: "레드미 패드 2 9.7",
        x: true,
        values: { nfc: "X", wireless: "X", sd: "O", jack: "O", ip: "없음", pen: "X", cell: "X" },
      },
      {
        n: "레드미 패드 2",
        x: true,
        values: { nfc: "X", wireless: "X", sd: "O", jack: "확인필요", ip: "없음", pen: "O", cell: "X" },
      },
      {
        n: "레드미 패드 2 프로",
        x: true,
        values: { nfc: "X", wireless: "X", sd: "O", jack: "확인필요", ip: "확인필요", pen: "O", cell: "X" },
      },
      {
        n: "레드미 패드 2 프로 매트글라스",
        x: true,
        values: { nfc: "X", wireless: "X", sd: "O", jack: "확인필요", ip: "확인필요", pen: "O", cell: "X" },
      },
      {
        n: "샤오미 패드 8",
        x: true,
        values: { nfc: "O(태그만)", wireless: "X", sd: "X", jack: "X", ip: "IP52", pen: "O", cell: "X" },
      },
      {
        n: "샤오미 패드 미니",
        x: true,
        values: { nfc: "X", wireless: "X(펜만 3W)", sd: "X", jack: "X", ip: "IP52", pen: "O", cell: "X" },
      },
    ],
    notes: [
      "'확인필요'는 mi.com 공식 스펙 페이지에 기재가 없어서예요. 손님께 안내하기 전에 매장 전시 모델로 직접 확인하세요.",
      "샤오미 패드 8의 NFC는 결제가 아니라 태그 인식·파일 전송용이에요. 교통카드·삼성페이류 결제는 안 돼요.",
      "샤오미 패드 미니는 본체가 무선충전되는 게 아니라, 뒷면에서 Focus Pen을 3W로 역충전해주는 기능이에요.",
      "펜 지원 제품은 전부 각자 전용 펜(레드미 패드용 Redmi Smart Pen, 샤오미 패드용 Xiaomi Focus Pen)만 호환돼요 — 호환 안 되니 섞어 팔지 않도록 주의하세요.",
    ],
  },
};

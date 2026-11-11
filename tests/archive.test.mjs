import assert from "node:assert/strict";
import { readSource } from "./helpers/readSource.mjs";
import test from "node:test";
import ts from "typescript";

const url = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const read = readSource;
const dateUrl = url(
  compile(await read("features/archive/utils/archiveDate.ts"))
);
const dates = await import(dateUrl);
const themeUrl = url(
  compile(await read("styles/theme.ts")).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  )
);
const nativeUrl = url(
  "export const Pressable='Pressable',View='View',ScrollView='ScrollView',Modal='Modal',StyleSheet={create:x=>x,absoluteFill:{position:'absolute'}};"
);
const reactUrl = url(
  `export const useRef=initial=>({current:initial});export const useState=initial=>{const h=globalThis.__archive;const i=h.next++;if(!(i in h.values))h.values[i]=typeof initial==='function'?initial():initial;return [h.values[i],v=>h.values[i]=typeof v==='function'?v(h.values[i]):v];};`
);
const quoteLayoutUrl = url(compile(await read("utils/quoteLayout.ts")));
const { getQuoteMarkPositions } = await import(quoteLayoutUrl);
const base = {
  "@/utils/quoteLayout": quoteLayoutUrl,
  "react/jsx-runtime": import.meta.resolve("react/jsx-runtime"),
  react: reactUrl,
  "react-native": nativeUrl,
  "expo-image": url("export const Image='Image';"),
  "expo-status-bar": url("export const StatusBar='StatusBar';"),
  "expo-router": url(
    "export const router={canGoBack:()=>globalThis.__archive.canGoBack,back:()=>globalThis.__archive.back++,replace:p=>globalThis.__archive.replaced=p};"
  ),
  "react-native-safe-area-context": url(
    "export const SafeAreaView='SafeAreaView',useSafeAreaInsets=()=>({top:24,bottom:16});"
  ),
  "@/components/AppText": url("export const AppText='AppText';"),
  "@/components/QuoteText": url(
    "export const QuoteText=({content,...props})=>({type:'QuoteText',props:{...props,children:content}});"
  ),
  "@/styles/theme": themeUrl,
  "@/features/archive/utils/archiveDate": dateUrl,
};
async function moduleUrl(file, extra = {}) {
  let code = compile(await read(file)).replace(
    /require\(['"][^'"]+['"]\)/g,
    "1"
  );
  for (const [from, to] of Object.entries({ ...base, ...extra }))
    code = code
      .replaceAll(`from '${from}'`, `from '${to}'`)
      .replaceAll(`from "${from}"`, `from "${to}"`);
  return url(code);
}
const dataUrl = await moduleUrl("features/archive/fixtures/archiveFixtures.ts");
const cardUrl = await moduleUrl(
  "features/archive/components/ArchiveQuoteCard.tsx"
);
const { getDateArchiveFixtures, getMonthlyArchiveFixtures } = await import(
  dataUrl
);
const { ArchiveQuoteCard } = await import(cardUrl);
const { ArchiveCalendar, ArchiveMonthPicker } = await import(
  await moduleUrl("features/archive/components/ArchiveCalendar.tsx")
);
const controlsUrl = url(
  "export const ArchiveCalendar='ArchiveCalendar',ArchiveMonthPicker='ArchiveMonthPicker',ArchiveMonthBar='ArchiveMonthBar',ArchiveArrow='ArchiveArrow';"
);
const { ArchiveScreen } = await import(
  await moduleUrl("features/archive/screens/ArchiveScreen.tsx", {
    "@/features/archive/components/ArchiveCalendar": controlsUrl,
    "@/features/archive/fixtures/archiveFixtures": dataUrl,
    "@/features/archive/components/ArchiveQuoteCard": cardUrl,
  })
);
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : typeof tree.type === "function"
      ? nodes(tree.type(tree.props))
      : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
const text = (tree) =>
  typeof tree === "string" || typeof tree === "number"
    ? String(tree)
    : !tree
      ? ""
      : Array.isArray(tree)
        ? tree.map(text).join("")
        : typeof tree.type === "function"
          ? text(tree.type(tree.props))
          : text(tree.props?.children);
const realDate = Date;
const today = new realDate(2026, 10, 11, 12);
function frozen(run) {
  globalThis.Date = class extends realDate {
    constructor(...args) {
      super(...(args.length ? args : [today.getTime()]));
    }
    static now() {
      return today.getTime();
    }
  };
  try {
    return run();
  } finally {
    globalThis.Date = realDate;
  }
}

test("calendar grids align Sundays, span five or six weeks, and include leap day", () => {
  for (const [year, month, count] of [
    [2026, 10, 35],
    [2026, 7, 42],
    [2024, 1, 35],
  ]) {
    const grid = dates.getCalendarDates(new Date(year, month, 1));
    assert.equal(grid.length, count);
    assert.equal(grid[0].getDay(), 0);
    assert.equal(grid.at(-1).getDay(), 6);
    for (let i = 1; i < grid.length; i++)
      assert.equal(
        dates.archiveDateKey(grid[i]),
        dates.archiveDateKey(
          new Date(
            grid[i - 1].getFullYear(),
            grid[i - 1].getMonth(),
            grid[i - 1].getDate() + 1
          )
        )
      );
  }
  assert.ok(
    dates
      .getCalendarDates(new Date(2024, 1, 1))
      .some((d) => dates.archiveDateKey(d) === "2024-02-29")
  );
});

test("month and year moves clamp month ends and today without admitting future selection", () => {
  assert.equal(
    dates.archiveDateKey(
      dates.getArchiveDateInMonth(new Date(2024, 0, 31), 2024, 1, today)
    ),
    "2024-02-29"
  );
  assert.equal(
    dates.archiveDateKey(
      dates.getArchiveDateInMonth(new Date(2025, 0, 31), 2025, 1, today)
    ),
    "2025-02-28"
  );
  assert.equal(
    dates.archiveDateKey(
      dates.getArchiveDateInMonth(new Date(2026, 9, 31), 2026, 10, today)
    ),
    "2026-11-11"
  );
  assert.equal(
    dates.isFutureArchiveDate(new Date(2026, 10, 11, 23), today),
    false
  );
  assert.equal(dates.isFutureArchiveDate(new Date(2026, 10, 12), today), true);
  assert.equal(
    dates.isFutureArchiveMonth(new Date(2026, 10, 30), today),
    false
  );
  assert.equal(dates.isFutureArchiveMonth(new Date(2026, 11, 1), today), true);
  assert.equal(
    dates.getArchiveMonthInYear(new Date(2025, 11, 1), 2026, today).getMonth(),
    10
  );
  assert.equal(
    dates.getArchiveMonthInYear(new Date(2025, 11, 1), 2027, today),
    null
  );
  assert.equal(dates.archiveDateKey(new Date(2026, 0, 1)), "2026-01-01");
});

test("calendar labels mark selected/today, disable future dates and can select neighboring month", () =>
  frozen(() => {
    let selected;
    let opened = 0;
    const tree = ArchiveCalendar({
      month: new Date(2026, 10, 1),
      selectedDate: new Date(2026, 10, 7),
      onMoveMonth() {},
      onSelectDate: (d) => (selected = d),
      onOpenPicker: () => opened++,
    });
    const buttons = nodes(tree).filter((n) => n.type === "Pressable");
    const future = buttons.find(
      (n) => n.props.accessibilityLabel === "2026년 11월 12일"
    );
    assert.ok(future.props.disabled);
    future.props.onPress();
    assert.equal(selected, undefined);
    assert.ok(
      buttons.find((n) => n.props.accessibilityLabel === "2026년 11월 7일")
        .props.accessibilityState.selected
    );
    assert.ok(
      buttons.find(
        (n) => n.props.accessibilityLabel === "2026년 11월 11일, 오늘"
      )
    );
    const older = ArchiveCalendar({
      month: new Date(2026, 9, 1),
      selectedDate: new Date(2026, 9, 7),
      onMoveMonth() {},
      onSelectDate: (d) => (selected = d),
      onOpenPicker() {},
    });
    const prev = nodes(older).find(
      (n) => n.props.accessibilityLabel === "2026년 9월 30일"
    );
    prev.props.onPress();
    assert.equal(dates.archiveDateKey(selected), "2026-09-30");
    buttons
      .find((n) => n.props.accessibilityLabel === "월 선택")
      .props.onPress();
    assert.equal(opened, 1);
    assert.ok(
      buttons.find((n) => n.props.accessibilityLabel === "다음 달").props
        .disabled
    );
  }));

test("month picker disables future months/year and supports outside/back dismissal", () =>
  frozen(() => {
    let closed = 0;
    let selected;
    const tree = ArchiveMonthPicker({
      visible: true,
      month: new Date(2026, 10, 1),
      onClose: () => closed++,
      onMoveYear() {},
      onSelectMonth: (m) => (selected = m),
    });
    const buttons = nodes(tree).filter((n) => n.type === "Pressable");
    assert.ok(
      buttons.find((n) => n.props.accessibilityLabel === "다음 해").props
        .disabled
    );
    const december = buttons.find((n) => n.props.accessibilityLabel === "12월");
    assert.ok(december.props.disabled);
    december.props.onPress();
    assert.equal(selected, undefined);
    buttons.find((n) => n.props.accessibilityLabel === "10월").props.onPress();
    assert.equal(selected, 9);
    tree.props.onRequestClose();
    buttons
      .find((n) => n.props.accessibilityLabel === "월 선택 닫기")
      .props.onPress();
    assert.equal(closed, 2);
  }));

test("archive screen coordinates date/month/year selection, empty states and back navigation", () =>
  frozen(() => {
    const h = { next: 0, values: [], canGoBack: true, back: 0 };
    globalThis.__archive = h;
    const render = () => {
      h.next = 0;
      return ArchiveScreen();
    };
    const control = (tree, type) => nodes(tree).find((n) => n.type === type);
    let tree = render();
    assert.equal(
      nodes(tree).filter(
        (n) => n.type === "Pressable" && n.props.accessibilityLabel === "북마크"
      ).length,
      3
    );
    control(tree, "ArchiveCalendar").props.onMoveMonth(1);
    tree = render();
    assert.equal(control(tree, "ArchiveCalendar").props.month.getMonth(), 10);
    control(tree, "ArchiveCalendar").props.onSelectDate(new Date(2026, 10, 10));
    tree = render();
    assert.match(text(tree), /이날 작성된 명언이 없어요/);
    control(tree, "ArchiveCalendar").props.onSelectDate(new Date(2026, 10, 12));
    tree = render();
    assert.equal(
      control(tree, "ArchiveCalendar").props.selectedDate.getDate(),
      10
    );
    control(tree, "ArchiveCalendar").props.onSelectDate(new Date(2026, 9, 31));
    tree = render();
    control(tree, "ArchiveCalendar").props.onMoveMonth(1);
    tree = render();
    assert.equal(
      dates.archiveDateKey(control(tree, "ArchiveCalendar").props.selectedDate),
      "2026-11-11"
    );
    control(tree, "ArchiveCalendar").props.onOpenPicker();
    tree = render();
    assert.equal(control(tree, "ArchiveMonthPicker").props.visible, true);
    control(tree, "ArchiveMonthPicker").props.onMoveYear(1);
    tree = render();
    assert.equal(
      control(tree, "ArchiveMonthPicker").props.month.getFullYear(),
      2026
    );
    control(tree, "ArchiveMonthPicker").props.onMoveYear(-1);
    tree = render();
    assert.equal(
      control(tree, "ArchiveMonthPicker").props.month.getFullYear(),
      2025
    );
    control(tree, "ArchiveMonthPicker").props.onSelectMonth(1);
    tree = render();
    assert.equal(control(tree, "ArchiveCalendar").props.month.getMonth(), 1);
    assert.equal(control(tree, "ArchiveMonthPicker").props.visible, false);
    control(tree, "ArchiveArrow").props.onPress();
    assert.equal(h.back, 1);
    h.canGoBack = false;
    control(tree, "ArchiveArrow").props.onPress();
    assert.equal(h.replaced, "/home");
    const tabs = nodes(tree).filter((n) => n.props.accessibilityRole === "tab");
    assert.equal(tabs.length, 3);
    assert.ok(tabs.every((n) => !n.props.disabled));
    assert.ok(tabs[0].props.accessibilityState.selected);
  }));

test("archive fixture and cards keep tag/author data while bookmark/share remain disconnected", () => {
  assert.equal(getDateArchiveFixtures(new Date(2026, 9, 7), today).length, 3);
  assert.equal(getDateArchiveFixtures(new Date(2026, 9, 8), today).length, 0);
  const quote = getDateArchiveFixtures(today, today)[0];
  const tree = ArchiveQuoteCard({ quote });
  assert.match(text(tree), /듀가나다 \(2000~\)/);
  assert.match(text(tree), /듀랄라/);
  const buttons = nodes(tree).filter((n) => n.type === "Pressable");
  assert.equal(buttons.length, 2);
  assert.ok(buttons.every((n) => n.props.disabled && !n.props.onPress));
});

const { QuoteText } = await import(await moduleUrl("components/QuoteText.tsx"));
test("short text moves decoration without shrinking the body allocation or changing vertical positioning", () => {
  for (const variant of ["archive", "feed"]) {
    const h = { next: 0, values: [] };
    globalThis.__archive = h;
    const render = (content) => {
      h.next = 0;
      return QuoteText({ content, variant });
    };
    let tree = render("잠시 쉬어가도 괜찮아");
    const body = nodes(tree).find((n) => n.type === "AppText");
    assert.equal(body.props.style[0].alignSelf, "stretch");
    assert.equal(
      body.props.style[1].textAlign,
      variant === "archive" ? "center" : "left"
    );
    const bodyStyle = body.props.style;
    const rowStyle = tree.props.style;
    tree.props.onLayout({ nativeEvent: { layout: { width: 345 } } });
    body.props.onTextLayout({ nativeEvent: { lines: [{ width: 120 }] } });
    tree = render("잠시 쉬어가도 괜찮아");
    assert.deepEqual(tree.props.style, rowStyle);
    assert.deepEqual(
      nodes(tree).find((n) => n.type === "AppText").props.style,
      bodyStyle
    );
    let images = nodes(tree).filter((n) => n.type === "Image");
    const shortPositions = images.map((n) => n.props.style[1].left);
    const vertical = images.map((n) => ({
      top: n.props.style[0].top,
      marginTop: n.props.style[0].marginTop,
      height: n.props.style[0].height,
    }));
    assert.ok(images.every((n) => n.props.style[0].opacity === 1));
    nodes(tree)
      .find((n) => n.type === "AppText")
      .props.onTextLayout({
        nativeEvent: { lines: [{ width: 270 }, { width: 180 }] },
      });
    tree = render("가".repeat(30) + "\n다음 줄😀");
    assert.deepEqual(tree.props.style, rowStyle);
    const longBody = nodes(tree).find((n) => n.type === "AppText");
    assert.deepEqual(longBody.props.style, bodyStyle);
    assert.equal(longBody.props.children, "가".repeat(30) + "\n다음 줄😀");
    assert.equal(longBody.props.numberOfLines, undefined);
    images = nodes(tree).filter((n) => n.type === "Image");
    assert.deepEqual(
      images.map((n) => ({
        top: n.props.style[0].top,
        marginTop: n.props.style[0].marginTop,
        height: n.props.style[0].height,
      })),
      vertical
    );
    assert.ok(images[1].props.style[1].left > shortPositions[1]);
    if (variant === "archive")
      assert.ok(images[0].props.style[1].left < shortPositions[0]);
    else assert.equal(images[0].props.style[1].left, shortPositions[0]);
  }
});

test("quote positions follow measured text inside maximum body width for center and left alignment", () => {
  assert.deepEqual(getQuoteMarkPositions(345, 120, "archive"), {
    left: 77.5,
    right: 256.5,
  });
  assert.deepEqual(getQuoteMarkPositions(345, 400, "archive"), {
    left: 0,
    right: 334,
  });
  assert.deepEqual(getQuoteMarkPositions(345, 120, "feed"), {
    left: 0,
    right: 176,
  });
  assert.deepEqual(getQuoteMarkPositions(345, 400, "feed"), {
    left: 0,
    right: 329,
  });
  assert.deepEqual(getQuoteMarkPositions(300, 400, "archive"), {
    left: 0,
    right: 289,
  });
});

test("monthly preview lists filter by month, sort newest first, and keep current-day records in range", () => {
  for (const tab of ["mine", "bookmarks"]) {
    const current = getMonthlyArchiveFixtures(
      new Date(2026, 10, 1),
      tab,
      today
    );
    assert.equal(current.length, 2);
    assert.ok(
      current.every(
        (q) => q.createdAt.startsWith("2026-11-") && q.createdAt <= "2026-11-11"
      )
    );
    assert.ok(current[0].createdAt >= current[1].createdAt);
    assert.ok(
      getMonthlyArchiveFixtures(new Date(2026, 9, 1), tab, today).every((q) =>
        q.createdAt.startsWith("2026-10-")
      )
    );
    assert.deepEqual(
      getMonthlyArchiveFixtures(new Date(2026, 8, 1), tab, today),
      []
    );
    assert.deepEqual(
      getMonthlyArchiveFixtures(new Date(2026, 11, 1), tab, today),
      []
    );
  }
  assert.equal(
    getMonthlyArchiveFixtures(
      new Date(2026, 10, 1),
      "mine",
      new Date(2026, 10, 1)
    ).length,
    1
  );
  const previousYear = getMonthlyArchiveFixtures(
    new Date(2025, 11, 1),
    "mine",
    new Date(2026, 0, 2)
  );
  assert.equal(previousYear.length, 2);
  assert.ok(previousYear.every((q) => q.createdAt.startsWith("2025-12-")));
  assert.ok(
    getMonthlyArchiveFixtures(new Date(2026, 10, 1), "mine", today).every(
      (q) => q.nickname === "듀가나다"
    )
  );
  assert.ok(
    getMonthlyArchiveFixtures(new Date(2026, 10, 1), "bookmarks", today).every(
      (q) => q.isBookmarked
    )
  );
});

test("AI original appears only in my-quotes presentation and non-AI cards do not show it", () => {
  const ai = getMonthlyArchiveFixtures(new Date(2026, 10, 1), "mine", today)[0];
  assert.match(
    text(ArchiveQuoteCard({ quote: ai, showOriginalContent: true })),
    new RegExp(ai.originalContent)
  );
  assert.ok(
    !text(ArchiveQuoteCard({ quote: ai })).includes(ai.originalContent)
  );
  assert.ok(
    !text(
      ArchiveQuoteCard({
        quote: { ...ai, isAiGenerated: false },
        showOriginalContent: true,
      })
    ).includes(ai.originalContent)
  );
  const bookmarked = nodes(ArchiveQuoteCard({ quote: ai })).find(
    (n) =>
      n.type === "Pressable" && n.props.accessibilityLabel === "북마크 취소"
  );
  assert.ok(bookmarked.props.disabled);
  assert.ok(bookmarked.props.accessibilityState.selected);
  assert.equal(bookmarked.props.onPress, undefined);
});

test("my quotes and bookmarks hide the date grid, share month navigation and show distinct empty messages", () =>
  frozen(() => {
    const h = { next: 0, values: [], canGoBack: true, back: 0 };
    globalThis.__archive = h;
    const render = () => {
      h.next = 0;
      return ArchiveScreen();
    };
    const find = (tree, type) => nodes(tree).find((n) => n.type === type);
    const switchTab = (tree, label) =>
      nodes(tree)
        .find((n) => n.props.accessibilityRole === "tab" && text(n) === label)
        .props.onPress();
    let tree = render();
    assert.ok(find(tree, "ArchiveCalendar"));
    switchTab(tree, "나의 명언");
    tree = render();
    assert.equal(find(tree, "ArchiveCalendar"), undefined);
    assert.ok(find(tree, "ArchiveMonthBar"));
    assert.match(text(tree), /오늘은 미루던 일을 조금 시작했어/);
    assert.equal(
      nodes(tree).filter(
        (n) =>
          n.type === "Pressable" &&
          ["북마크", "북마크 취소"].includes(n.props.accessibilityLabel)
      ).length,
      2
    );
    find(tree, "ArchiveMonthBar").props.onMoveMonth(1);
    tree = render();
    assert.equal(find(tree, "ArchiveMonthBar").props.month.getMonth(), 10);
    find(tree, "ArchiveMonthBar").props.onOpenPicker();
    tree = render();
    assert.equal(find(tree, "ArchiveMonthPicker").props.visible, true);
    find(tree, "ArchiveMonthPicker").props.onSelectMonth(9);
    tree = render();
    assert.equal(find(tree, "ArchiveMonthPicker").props.visible, false);
    switchTab(tree, "북마크");
    tree = render();
    assert.equal(find(tree, "ArchiveMonthBar").props.month.getMonth(), 9);
    assert.ok(!text(tree).includes("오늘은 미루던 일을 조금 시작했어"));
    assert.match(text(tree), /라라진/);
    find(tree, "ArchiveMonthBar").props.onMoveMonth(-1);
    tree = render();
    assert.match(text(tree), /마음에 드는 명언은 북마크를 통해 모아보세요/);
    switchTab(tree, "나의 명언");
    tree = render();
    assert.match(text(tree), /작성된 명언이 없어요/);
    switchTab(tree, "전체보기");
    tree = render();
    assert.ok(find(tree, "ArchiveCalendar"));
    assert.equal(find(tree, "ArchiveMonthBar"), undefined);
    assert.equal(find(tree, "ArchiveCalendar").props.month.getMonth(), 8);
  }));

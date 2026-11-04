// report-text.ts가 만드는 평문 보고서를 "미워크에 복사할 문구"는 그대로 두고, 앱 안 미리보기에서만
// 구역·소제목·불릿을 구분해 보여준다. 실제 복사되는 텍스트(copy 버튼)는 이 컴포넌트와 무관하게
// 원본 문자열을 그대로 쓴다 — 포맷을 바꾸는 게 아니라 "읽기 쉽게 보여주기"만 하는 용도.
function isBullet(line: string) {
  return line.startsWith("- ");
}

function isSectionHeader(line: string) {
  return /^\[.+\]$/.test(line);
}

/** 콜론도 대시도 없는 짧은 한 줄 — "일간 누적 실적" 같은 보고서 안 소제목으로 본다. */
function isSubHeader(line: string) {
  return !isBullet(line) && !line.includes(":") && !line.includes("：") && line.length <= 24;
}

export function ReportPreview({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.split("\n").filter((l) => l.trim().length > 0));

  return (
    <div className="rprev">
      {blocks.map((lines, i) => {
        if (!lines.length) return null;
        const header = isSectionHeader(lines[0]) ? lines[0].replace(/^\[|\]$/g, "") : null;
        const body = header ? lines.slice(1) : lines;
        if (!header && !body.length) return null;
        return (
          <div className={"rprev-block" + (header ? " has-head" : "")} key={i}>
            {header && <div className="rprev-head">{header}</div>}
            {body.map((line, j) =>
              isBullet(line) ? (
                <p className="rprev-li" key={j}>
                  {line.slice(2)}
                </p>
              ) : isSubHeader(line) ? (
                <p className="rprev-sub" key={j}>
                  {line}
                </p>
              ) : (
                <p className="rprev-p" key={j}>
                  {line}
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}

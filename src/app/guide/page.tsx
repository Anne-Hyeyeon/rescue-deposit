import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "이용 가이드 - 절대지켜",
  description: "배당 시뮬레이터 사용 방법을 단계별로 안내합니다.",
};

const Screenshot = ({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) => (
  <figure className="my-6">
    <div className="overflow-hidden rounded-2xl border border-card-border shadow-md">
      <Image
        src={src}
        alt={alt}
        width={900}
        height={780}
        className="w-full h-auto"
        unoptimized
      />
    </div>
    {caption && (
      <figcaption className="mt-2 text-center text-xs text-muted">
        {caption}
      </figcaption>
    )}
  </figure>
);

const StepNumber = ({ n }: { n: number }) => (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-solid text-white text-xs font-bold">
    {n}
  </span>
);

const SectionTitle = ({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 mb-4 mt-20 first:mt-0">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-solid text-white text-sm font-bold">
      {step}
    </span>
    <h2 className="text-xl font-bold text-foreground">{children}</h2>
  </div>
);

const SubTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground mt-10 mb-3">
    {children}
  </h3>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-sub-text leading-loose">{children}</p>
);

const BulletList = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="text-sm text-sub-text leading-loose space-y-2 pl-5 list-disc">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div className="my-5 rounded-xl border border-card-border bg-card-bg px-4 py-3.5 text-sm text-sub-text leading-loose">
    {children}
  </div>
);

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-10 pb-24">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
          이용 가이드
        </h1>
        <Paragraph>
          배당 시뮬레이터 사용 방법을 단계별로 안내합니다.
        </Paragraph>
      </div>

      {/* 시작하기 전에 */}
      <div className="rounded-2xl border border-card-border bg-card-bg p-5 mb-10">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          시작하기 전에
        </h2>
        <BulletList
          items={[
            "PC 환경에서 사용하는 것을 권장합니다. 모바일에서도 사용 가능하지만, 입력 항목이 많아 PC가 편합니다.",
            "카카오톡, 링크드인 등 앱 내 브라우저에서는 구글 로그인이 작동하지 않습니다. Safari, Chrome 등 외부 브라우저를 사용해 주세요.",
            "이 서비스는 법률 자문을 제공하지 않습니다. 시뮬레이션 결과는 참고용이며, 정확한 판단은 반드시 법률 전문가의 자문을 받으시기 바랍니다.",
          ]}
        />
      </div>

      {/* 홈 화면 소개 */}
      <Screenshot
        src="/guide/00-home.png"
        alt="절대지켜 홈 화면"
        caption="홈 화면"
      />

      {/* ── 1. 로그인 ── */}
      <SectionTitle step={1}>로그인</SectionTitle>
      <Paragraph>
        서비스의 모든 기능은 로그인 후 사용 가능합니다. 로그인하지 않은 상태에서
        시뮬레이터, 마이페이지 등에 접근하면 자동으로 로그인 페이지로
        이동합니다. 현재 구글 계정 로그인만 지원합니다.
      </Paragraph>
      <InfoBox>
        카카오톡, 링크드인 등 앱 내장 브라우저에서는 구글 로그인이 작동하지
        않습니다. 반드시 Safari, Chrome 등 외부 브라우저에서 접속해 주세요.
      </InfoBox>

      {/* ── 2. 시뮬레이션 입력 ── */}
      <SectionTitle step={2}>시뮬레이션 입력</SectionTitle>

      <SubTitle>2-1. 데이터 불러오기</SubTitle>
      <Paragraph>시뮬레이터 상단에서 데이터를 불러올 수 있습니다.</Paragraph>
      <BulletList
        items={[
          <>
            <strong>내 데이터 입력하기</strong>: 마이페이지에 저장해둔 엑셀
            데이터를 불러옵니다.
          </>,
          <>
            <strong>데모 데이터</strong>: 미리 준비된 실제 사례로 서비스를
            체험할 수 있습니다.
          </>,
        ]}
      />
      <Screenshot
        src="/guide/01-simulate-top.png"
        alt="시뮬레이터 상단: 데이터 불러오기 영역"
        caption="시뮬레이터 상단: 내 데이터 불러오기, 실제 사례 데모"
      />
      <Paragraph>
        처음 사용하는 경우, 시뮬레이터의 입력 양식에 따라 직접 정보를 입력한
        다음, 하단의 &ldquo;입력 정보를 엑셀로 저장&rdquo; 버튼을 눌러
        저장하세요. 이 엑셀 파일을 마이페이지에 올려두면, 다음부터는 &ldquo;내
        데이터 입력하기&rdquo;로 간편하게 불러올 수 있습니다.
      </Paragraph>

      <SubTitle>2-2. 매각대금 정보</SubTitle>
      <Screenshot
        src="/guide/02-simulate-form.png"
        alt="시뮬레이터 입력 양식: 감정가, 매각대금, 나의 임차 정보"
        caption="Section 1. 감정가 및 매각대금, Section 2. 나의 임차 정보"
      />
      <Paragraph>
        <strong>감정가를 아는 경우</strong> &mdash; 감정평가액을 입력하면
        낙찰가율 버튼(100%, 90%, 86%, 80%, 70%, 60%)이 나타납니다. 원하는 비율을
        선택하면 매각대금이 자동 계산됩니다. 이미 낙찰된 경우에는 &ldquo;낙찰
        완료&rdquo; 체크 후 실제 낙찰가를 입력하면 됩니다.
      </Paragraph>
      <Paragraph>
        <strong>감정가를 모르는 경우</strong> &mdash; &ldquo;모릅니다&rdquo;를
        선택하면 매각대금만 직접 입력하는 양식으로 바뀝니다. 감정가를 몰라도
        시뮬레이션은 가능합니다. 다만, 결과 페이지에서 매각대금 조정 기능을
        사용하려면 감정가가 필요합니다.
      </Paragraph>
      <Paragraph>
        <strong>집행비용</strong> &mdash; 경매 진행에 드는 비용(감정료, 공고비
        등)입니다. 접혀 있는 항목을 펼치면 수정할 수 있고, 기본값은
        1,000만원입니다. 일반적으로 500만원에서 1,500만원 사이입니다.
      </Paragraph>

      <SubTitle>2-3. 나의 임차 정보</SubTitle>
      <Paragraph>본인의 보증금과 대항력 발생일을 입력합니다.</Paragraph>
      <BulletList
        items={[
          <>
            <strong>보증금</strong>: 전세 보증금 전액을 입력합니다.
          </>,
          <>
            <strong>대항력 발생일</strong>: 전입신고일의 다음 날입니다. 예를
            들어 3월 1일에 전입신고를 했다면 3월 2일을 입력합니다.
          </>,
          <>
            <strong>점유 여부</strong>: 현재 해당 주소에 실거주하고 있는지
            체크합니다.
          </>,
        ]}
      />
      <Paragraph>
        본인 정보를 입력하지 않고 다른 세입자 정보만으로 시뮬레이션을 돌리는
        것도 가능합니다.
      </Paragraph>

      <SubTitle>2-4. 건물 및 근저당 정보</SubTitle>
      <Paragraph>
        <strong>주소 검색</strong>을 하면 지역 구간(서울, 수도권 과밀억제권역,
        광역시, 기타)이 자동으로 판별됩니다. 소액임차인 기준은 지역에 따라
        다르므로, 정확한 주소 입력이 중요합니다.
      </Paragraph>
      <Paragraph>
        <strong>근저당 정보</strong>는 등기부등본을 참고해서 입력합니다.
      </Paragraph>
      <BulletList
        items={[
          <>
            <strong>근저당 설정일</strong>: 등기부등본 갑구 또는 을구에 기재된
            접수일자입니다.
          </>,
          <>
            <strong>채권최고액</strong>: 등기부등본에 기재된 금액입니다.
          </>,
        ]}
      />
      <InfoBox>
        근저당 설정일을 기준으로 소액임차인 판별 기준(어느 시점의 법령을
        적용할지)이 결정되므로 정확하게 입력해 주세요.
      </InfoBox>

      <SubTitle>2-5. 다른 세입자 및 재산세</SubTitle>
      <Paragraph>
        같은 건물에 다른 세입자가 있으면 추가합니다. 이름, 보증금, 대항력
        발생일을 입력합니다. 다가구 주택은 건물 전체가 일괄 경매되기 때문에,
        다른 세입자 정보가 배당 결과에 영향을 줍니다.
      </Paragraph>
      <Paragraph>
        <strong>재산세</strong>는 매각 부동산에 부과된 재산세(당해세)
        정보입니다. 모르는 경우 &ldquo;모름&rdquo;을 선택하면 됩니다.
      </Paragraph>

      {/* ── 3. 데이터 저장 ── */}
      <SectionTitle step={3}>입력 데이터 저장</SectionTitle>
      <Paragraph>
        정보 입력을 마쳤으면, &ldquo;배당액 계산하기&rdquo; 버튼 아래에 있는
        &ldquo;입력 정보를 엑셀로 저장&rdquo;을 눌러 데이터를 보관하세요. 이
        엑셀 파일을 마이페이지에 올려두면, 다음에 다시 사용할 때 &ldquo;내
        데이터 입력하기&rdquo;로 바로 불러올 수 있습니다.
      </Paragraph>

      {/* ── 4. 결과 확인 ── */}
      <SectionTitle step={4}>결과 확인</SectionTitle>
      <Paragraph>
        &ldquo;배당액 계산하기&rdquo;를 누르면 결과 페이지로 이동합니다. 예상
        배당금과 보증금 대비 회수율이 상단에 표시됩니다.
      </Paragraph>
      <Screenshot
        src="/guide/03-result-hero.png"
        alt="결과 페이지: 예상 배당액, 매각대금 조정"
        caption="예상 배당액, 회수율, 매각대금 조정 영역"
      />

      <SubTitle>4-1. 배당표</SubTitle>
      <Paragraph>
        배당 순서에 따라 누가 얼마를 받는지 표로 보여줍니다. 본인의 행은 강조
        표시됩니다.
      </Paragraph>
      <Screenshot
        src="/guide/04-result-table.png"
        alt="배당표: 순서별 배당 내역"
        caption="배당 순서표: 소액임차인, 담보물권, 확정일자 임차인 순서로 배당"
      />

      <SubTitle>4-2. 매각대금 조정</SubTitle>
      <Paragraph>
        감정가를 입력한 경우, 결과 페이지에서 매각대금을 바꿔가며 실시간으로
        재시뮬레이션할 수 있습니다. 비율 버튼을 누르거나 금액을 직접 조정할 수
        있습니다.
      </Paragraph>

      <InfoBox>
        증액 보증금 등 일부 특수한 케이스는 현재 다루지 않습니다. 시뮬레이션
        결과는 일반적인 배당 절차를 기준으로 산출되므로, 복잡한 사안은 반드시
        법률 전문가와 상의해 주세요.
      </InfoBox>

      {/* ── 5. AI 해설 ── */}
      <SectionTitle step={5}>AI 배당표 해설</SectionTitle>
      <Paragraph>
        시뮬레이션 결과에 대해 AI가 배당표를 단계별로 해설해 줍니다. 왜 이런
        순서로 배당이 이루어졌는지, 본인의 배당 순위가 어떻게 결정되었는지를
        설명합니다.
      </Paragraph>

      <SubTitle>이용 방법</SubTitle>
      <ol className="text-sm text-sub-text leading-relaxed space-y-1.5 pl-5 list-decimal">
        <li>결과 페이지에서 &ldquo;AI 해설 보기&rdquo; 버튼을 누릅니다.</li>
        <li>처음 사용하는 경우, 간단한 설문에 응답합니다.</li>
        <li>설문을 완료하면 무료 이용권 1회가 제공됩니다.</li>
        <li>해설이 스트리밍 방식으로 표시됩니다.</li>
      </ol>

      <InfoBox>
        생성된 해설은 자동으로 저장됩니다. 같은 입력 조건으로 다시 시뮬레이션을
        돌리면 이전에 저장된 동일한 해설이 그대로 표시됩니다. (새로 생성되지
        않습니다.) 데모 데이터로 시뮬레이션한 경우에는 크레딧 차감 없이 예시
        해설을 확인할 수 있습니다.
      </InfoBox>

      {/* ── 6. 결과 저장 및 공유 ── */}
      <SectionTitle step={6}>결과 저장 및 공유</SectionTitle>
      <Paragraph>
        결과 페이지 하단에서 다음 기능을 사용할 수 있습니다.
      </Paragraph>
      <Screenshot
        src="/guide/05-result-actions.png"
        alt="결과 활용하기: 저장, 공유, 엑셀, 이미지"
        caption="결과 활용하기: 마이페이지 저장, 공유 링크, 엑셀/이미지 다운로드"
      />

      <div className="mt-4 space-y-3">
        {[
          {
            title: "마이페이지에 저장",
            desc: "결과를 저장해두면 마이페이지에서 언제든 다시 볼 수 있습니다.",
          },
          {
            title: "공유 링크 만들기",
            desc: "제목을 입력하고 링크를 생성할 수 있습니다. 본인 정보 표시 여부, AI 해설 포함 여부를 선택할 수 있습니다. 링크를 받은 사람은 로그인 없이 결과를 볼 수 있습니다.",
          },
          {
            title: "엑셀로 저장",
            desc: "입력 정보, 배당 결과, AI 해설(있는 경우)이 포함된 엑셀 파일을 다운로드합니다.",
          },
          { title: "이미지로 저장", desc: "배당표를 PNG 이미지로 저장합니다." },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-card-border px-4 py-3"
          >
            <p className="text-sm font-medium text-foreground mb-0.5">
              {item.title}
            </p>
            <p className="text-sm text-sub-text">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ── 7. 마이페이지 ── */}
      <SectionTitle step={7}>마이페이지</SectionTitle>
      <Screenshot
        src="/guide/06-mypage.png"
        alt="마이페이지: 데이터 관리, 결과 관리"
        caption="마이페이지: 내 데이터 관리, 결과지 관리, AI 해설 내역"
      />

      <SubTitle>7-1. 내 데이터 관리</SubTitle>
      <Paragraph>
        시뮬레이션에 사용할 입력 데이터를 엑셀 파일로 관리하는 공간입니다. 1개의
        파일만 저장할 수 있으며, 새로 올리면 기존 파일을 덮어씁니다.
      </Paragraph>
      <Paragraph>
        시뮬레이터에서 &ldquo;입력 정보를 엑셀로 저장&rdquo;한 파일을 여기에
        올려두면, 다음에 시뮬레이터에서 &ldquo;내 데이터 입력하기&rdquo;로 바로
        불러올 수 있습니다.
      </Paragraph>

      <SubTitle>7-2. 결과 관리</SubTitle>
      <Paragraph>
        공유한 결과 목록이 카드 형태로 표시됩니다. 공유 링크를 다시 복사하거나
        삭제할 수 있습니다.
      </Paragraph>

      <SubTitle>7-3. AI 해설 내역</SubTitle>
      <Paragraph>
        AI 해설 이용 내역과 남은 크레딧을 확인할 수 있습니다.
      </Paragraph>

      {/* 추천 순서 */}
      <div className="mt-16 rounded-2xl border border-accent/20 bg-accent/5 p-6">
        <h2 className="text-base font-bold text-foreground mb-5">
          추천하는 사용 순서
        </h2>
        <ol className="text-sm text-sub-text leading-relaxed space-y-3">
          {[
            "구글 계정으로 로그인한다.",
            "시뮬레이터에서 정보를 입력한다.",
            "\u201c입력 정보를 엑셀로 저장\u201d을 눌러 데이터를 보관한다.",
            "마이페이지에 엑셀을 올려둔다. (다음에 다시 사용 가능함.)",
            "\u201c배당액 계산하기\u201d를 눌러 결과를 확인한다.",
            "필요하면 AI 해설을 본다. (설문 완료 시 1회 무료)",
            "결과를 마이페이지에 저장하거나 공유 링크를 만들어 공유한다.",
          ].map((text, i) => (
            <li key={i} className="flex gap-3">
              <StepNumber n={i + 1} />
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

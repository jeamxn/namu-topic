import getAllTrendingWithReasons from "./getAllTrendingWithReasons";
import openai from "./openai";

const results = await getAllTrendingWithReasons();
console.log(results);

const stream = await openai.chat.completions.create({
  model: "gpt-5-nano-2025-08-07",
  messages: [
    {
      role: "system",
      content: `
      아래 나무위키 실시간 검색어 데이터를 정리해서 왜 이런 검색어가 실시간 검색어에 등장하는지 설명해줘.
      형식은 예시와 같이 마크다운 형식으로 작성해줘.

      [ 예시 ]
      # 1위: 블랙핑크
      ## 요약
      ㅇㅇㅇ한 사유로 ㅇㅇㅇ하여 실시간 검색어 ㅇ위
      ## 왜 실검에 올랐나 (맥락)
      (더 구체적인 맥락)
      ## 관련 정보
      - 블랙핑크는 대한민국의 5인조 그룹
      - ㅇㅇ년 ㅇㅇ일 데뷔
      - ㅇㅇ앨범 발매
      - ...
      ## 관련 URL
      - [URL1에 대한 설명](https://www.google.com)
      - [URL2에 대한 설명](https://www.google.com)
      - [URL3에 대한 설명](https://www.google.com) 
      - ...
      ## 관련 이미지
      - [이미지1에 대한 설명](https://www.google.com)
      - [이미지2에 대한 설명](https://www.google.com)
      - [이미지3에 대한 설명](https://www.google.com)
      - ...

      =======================================================
      [ 너가 처리할 순위 및 검색어 정보 ]
      =======================================================
      ${JSON.stringify(results, null, 2)}
      `,
    },
  ],
});

console.log(stream.choices[0]?.message?.content);

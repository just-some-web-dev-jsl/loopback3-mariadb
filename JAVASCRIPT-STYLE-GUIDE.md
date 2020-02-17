# JAVASCRIPT-STYLE-GUIDE for Coding Convention

- 최초작성일: 2019.01.10
- TODO: 작성중

---

- 현재 개발중인 Node.js 기반의 프로젝트들은 ES5 이하의 문법과 ES6 이상의 문법이 혼용되어 사용되고 있는 문제가 있다.
- 개발자들의 코딩 스타일이 각자 다르므로 코딩 컨벤션을 통일하기위해 아래 가이드를 적용해서 개발한다.
- 아래 내용들을 읽고 숙지하여 코딩 컨벤션이 최대한 맞춰졌으면 하는 바램이다.
- 또한, 가급적이면 누구든 쉽게 읽고 이해할 수 있는 가독성이 높은 코드를 만들어야 좋다.

## Guide

1. 공통적으로 JavaScript 프로젝트에는 eslint 와 prettier 를 사용한다.
2. 공통적으로 TypeScript 프로젝트에는 tslint 와 prettier 를 사용한다.
3. 현재 많은 회사와 팀들이 사용중인 eslint-config-airbnb-base 설정과 조합해서 사용한다.
4. 환경설정 파일은 .eslintrc 와 .prettierrc 를 기본으로 사용한다. 원한다면 json, js, yml 등의 포맷을 사용해도 되고, package.json 파일에 기술해도 된다.
5. 특별한 경우가 아니라면, 처음 설정해둔 내용을 변경하거나 추가하지 않는 것이 좋다. (소스 가독성, 소스 검색 및 Git 형상관리 등을 위해)

## ESLint

- [eslint](https://eslint.org/)

- ESLint란?
  ESLint는 오픈소스 JavaScript Linting 유틸리티이다.
  코드 Linting이란 특정 스타일 규칙을 준수하지 않는 문제가 있는 소스 코드를 찾는데 사용되는 방식을 말하며, Linter는 이러한 Linting을 수행하는 도구이다.
  대부분의 프로그래밍 언어에는 컴파일하는 과정이 있어서 컴파일시 수행되는 Linter가 내장되어있다.
  그러나 JavaScript는 별도의 컴파일 과정이 없는 동적 타입 언어이기 때문에 이러한 Linter가 존재하지 않는다.
  따라서 코드 일관성을 유지하고 버그를 찾아 수정하는 목적으로 ECMAScript/JavaScript 코드에서 발견된 패턴을 식별하고 보고하는 정적 분석 도구로 사용한다.
  과거 JSLint 및 JSHint 와 유사하지만 ESLint는 확장성이 높고 다양한 플러그인을 사용할 수 있기 때문에 현재 수많은 회사와 팀들이 ESLint를 사용하고 있다.

- 환경 설정 파일
  ESLint는 환경 설정 파일을 참고하여 소스 코드 체크를 수행한다.
  환경 설정 파일을 오픈 소스로 공개하여 자신들만의 ESLint 환경 설정을 배포하는 회사들도 있다.
  대표적으로 Airbnb, Google, Walmart, Naver 등이 있으며, 대부분 Airbnb 사의 환경 설정 파일을 사용한다.

  - https://github.com/airbnb/javascript
  - https://github.com/google/eslint-config-google
  - https://github.com/walmartlabs/eslint-config-walmart
  - https://github.com/naver/eslint-config-naver

- eslint-config-airbnb VS eslint-config-airbnb-base
  두 가지의 차이점을 이해한다. eslint-config-airbnb 패키지에는 React 플러그인이 들어있고, React 플러그인을 제외한 eslint-config-airbnb-base 패키지가 있다.

## Prettier

- [prettier](https://prettier.io/)

- Prettier란?
  Prettier는 다양한 IDE/Editor 에서 플러그인을 지원하고, 수많은 최신 프레임워크와 언어들을 지원하는 코드 포맷터이다.
  ESLint도 코드 포맷팅을 지원하지만 Prettier가 더 전문적인 포맷팅 툴이기 때문에 확장성이 좋다.
  ESLint와 같이 사용할 수 있는 eslint-plugin-prettier 플러그인도 제공된다.
  현재 자신이 사용중인 IDE/Editor 내에 다른 포맷터가 설치되어 사용중이라면, 제거하거나 사용을 중지 시켜준다.

- eslint-config-prettier 적용
  eslint-config-prettier은 prettier에서 관리해줄 수 있는 코드 스타일의 ESLint 규칙을 비활성화 시켜준다.
  따라서 ESLint는 Javascript 문법 관련된 것들만 관리하게 되고, 코드 스타일 관련 작업은 prettier가 담당한다.

- eslint-plugin-prettier 적용
  Runs Prettier as an ESLint rule and reports differences as individual ESLint issues.
  이 플러그인은 prettier에서 ESLint 설정을 연동해서 사용하게 해주는데, .prettierrc 파일의 설정을 사용하지않고 온전히 ESLint 설정으로만 관리하게 된다.
  하지만 js 파일이 아닌 경우 .prettierrc 파일의 설정을 따르므로 양쪽에 모두 설정을 해두어야 한다.

## StyleLint

- [stylelint](https://stylelint.io/)

- CSS/SCSS/LESS 등의 스타일시트 Linting은 StyleLint Linter를 사용한다.
- 프론트엔드 프로젝트에 적합하며, 필수는 아니므로 필요에 따라 적용한다.

## 프로젝트 적용

- 각 프로젝트마다 사용하는 프레임워크가 있다면 해당 프레임워크에서 제공하는 설정을 베이스로 사용하고 확장해서 사용한다.

- install packages

  ```bash
  # javascript 프로젝트
  npm i -D eslint prettier eslint-config-airbnb-base eslint-config-prettier eslint-plugin-prettier

  # react 프로젝트
  npm i -D eslint prettier eslint-config-airbnb eslint-config-prettier eslint-plugin-prettier

  # loopback 프로젝트
  npm i -D eslint prettier eslint-config-loopback eslint-config-prettier eslint-plugin-prettier
  ```

- .prettierrc

  ```json
  {
    "trailingComma": "es5",
    "printWidth": 160,
    "tabWidth": 2,
    "useTabs": false,
    "bracketSpacing": true,
    "semi": true,
    "singleQuote": true
  }
  ```

- .eslintrc

  ```json
  {
    "extends": ["loopback", "plugin:prettier/recommended"],
    "rules": {
      "prettier/prettier": [
        "error",
        {
          "trailingComma": "es5",
          "printWidth": 160,
          "tabWidth": 2,
          "useTabs": false,
          "bracketSpacing": true,
          "semi": true,
          "singleQuote": true
        }
      ]
    },
    "parserOptions": {
      "ecmaVersion": 9
    }
  }
  ```

- .vscode/settings.json

  ```json
  {
    "javascript.format.enable": false,
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true,
    "prettier.eslintIntegration": true,
    "eslint.autoFixOnSave": false
  }
  ```

### 참고할만한 문서들

- [JavaScript Standard Style](https://standardjs.com/readme-kokr.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Naver JavaScript Style Guide](https://github.com/naver/eslint-config-naver/blob/master/STYLE_GUIDE.md)
- [NHN Coding Convention for Markup Languages (HTML/CSS)](https://nuli.navercorp.com/data/convention/NHN_Coding_Conventions_for_Markup_Languages.pdf)
- [[번역] 좋은 코딩을 위한 13 가지 간단한 규칙](https://mingrammer.com/translation-13-simple-rules-for-good-coding/)
- [[번역] 정말 읽기 쉬운 코드를 작성하는 최우선 15가지+ 최고의 방법](https://mytory.net/archives/1098)

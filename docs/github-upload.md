# GitHub 업로드 방법

## GitHub Desktop 사용
1. GitHub에서 새 저장소 `creator-safe-support` 생성
2. GitHub Desktop에서 `File > Clone repository` 선택
3. 생성한 저장소를 PC에 클론
4. 이 프로젝트 ZIP 압축을 해제한 뒤 모든 파일을 클론 폴더에 복사
5. GitHub Desktop 왼쪽 Changes 확인
6. Summary에 `feat: add creator safe support platform` 입력
7. Commit to main 클릭
8. Push origin 클릭

## 명령어 사용

```bash
git clone https://github.com/pjk820508-cyber/creator-safe-support.git
cd creator-safe-support
# 압축 해제한 파일 전체 복사
git add .
git commit -m "feat: add creator safe support platform"
git push origin main
```

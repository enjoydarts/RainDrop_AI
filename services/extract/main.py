from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
import trafilatura

app = FastAPI(
    title="Raindrop AI - Extract Service",
    description="記事本文抽出サービス (trafilatura)",
    version="1.0.0"
)


class ExtractRequest(BaseModel):
    """抽出リクエスト"""
    url: HttpUrl


class ExtractResponse(BaseModel):
    """抽出レスポンス"""
    title: str
    text: str
    length: int
    language: str
    method: str = "trafilatura"


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy", "service": "extract"}


@app.post("/extract", response_model=ExtractResponse)
async def extract_content(request: ExtractRequest):
    """
    URLから記事本文を抽出

    Args:
        request: 抽出対象のURL

    Returns:
        ExtractResponse: 抽出結果（タイトル、本文、文字数、言語）

    Raises:
        HTTPException: 404 - コンテンツが見つからない
        HTTPException: 422 - 抽出に失敗
        HTTPException: 500 - その他のエラー
    """
    try:
        # URLからコンテンツをダウンロード
        downloaded = trafilatura.fetch_url(str(request.url))

        if not downloaded:
            raise HTTPException(
                status_code=404,
                detail="Content not found or failed to download"
            )

        # 本文を抽出（JSON形式で取得）
        result = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            output_format="json"
        )

        if not result:
            raise HTTPException(
                status_code=422,
                detail="Extraction failed - content may not be an article"
            )

        # JSON文字列をパース
        import json
        data = json.loads(result)

        # レスポンスを構築
        return ExtractResponse(
            title=data.get("title", ""),
            text=data.get("text", ""),
            length=len(data.get("text", "")),
            language=data.get("language", "unknown"),
        )

    except HTTPException:
        # HTTPExceptionはそのまま再送出
        raise
    except Exception as e:
        # その他のエラーは500として返す
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "service": "Raindrop AI - Extract Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "extract": "/extract (POST)"
        }
    }

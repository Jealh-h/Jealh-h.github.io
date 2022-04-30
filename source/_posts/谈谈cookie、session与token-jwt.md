---
title: 谈谈cookie、session与token(jwt)
date: 2021-12-07 22:04:05
categories: web
---

**首先呢，网上关于它们的文章已经很多了，在这里我就只是来记录以下我的理解，其实也是看其他网上内容的一个总结吧。**

> **前言：由于 HTTP 协议无状态的缺陷。WEB 的设计者们提出了 Cookie 和 Session 两种解决机制。而 token,通常是 jwt(json web token)作为一种用户身份令牌，也常常用于记录 http 的状态存储，通常是在用户登录后，伴随每一次请求发送给给后端。下面就来聊聊它们。**

 <!--more-->

### cookie

#### 概念

Cookie 是一段不超过 4KB 的小型文本数据，由一个名称（Name）、一个值（Value）和其它几个用于控制 Cookie 有效期、安全性、使用范围的可选属性组成。
包括：

1. Name/Value：设置 Cookie 的名称及相对应的值，对于认证 Cookie，Value 值包括 Web 服务器所提供的访问令牌。
2. Expires 属性：设置 Cookie 的生存期。有两种存储类型的 Cookie：会话性与持久性。Expires 属性缺省时，为会话性 Cookie，仅保存在客户端内存中，并在用户关闭浏览器时失效；持久性 Cookie 会保存在用户的硬盘中，直至生存期到或用户直接在网页中单击“注销”等按钮结束会话时才会失效。
3. Domain 属性：指定了可以访问该 Cookie 的 Web 站点或域。Cookie 机制并未遵循严格的同源策略，允许一个子域（域名前缀不同）可以设置或获取其父域的 Cookie。
4. Secure 属性：指定是否使用 HTTPS 安全协议发送 Cookie。
5. Path 属性：定义了 Web 站点上可以访问该 Cookie 的目录。
6. HTTPOnly 属性 ：用于防止客户端脚本通过 document.cookie 属性访问 Cookie，有助于保护 Cookie 不被跨站脚本攻击窃取或篡改。但是，HTTPOnly 的应用仍存在局限性，一些浏览器可以阻止客户端脚本对 Cookie 的读操作，但允许写操作；此外大多数浏览器仍允许通过 XMLHTTP 对象读取 HTTP 响应中的 Set-Cookie 头。
   **好了，以上内容是来自百度百科。简单地做个总结：cookie 是一种存储在客户端的小型文本数据，里面的类容有键值对、生存周期、访问域、是否使用 http,web 站点可访问 cookie 的目录以及是否允许客户端读取 cookie。**

#### 安全性

**XSRF/CSRF（跨站请求伪造）**：利用的是 web 中用户身份验证的一个漏洞：简单的身份验证只能保证请求发自某个用户的浏览器,却不能保证请求本身是用户自愿发出的。这里有一些如 Firefox、Opera 等浏览器使用单进程机制，**多个窗口或标签使用同一个进程，共享 Cookie 等会话数据**。IE 则混合使用单进程与多进程模式，一个窗口中的多个标签，以及使用“CTRL+N” 或单击网页中的链接打开的新窗口使用同一进程，共享会话数据；只有直接运行 IE 可执行程序打开窗口时，才会创建新的进程。**Chrome 虽然使用多进程机制，然而经测试发现，其不同的窗口或标签之间仍会共享会话数据，除非使用隐身访问方式。**因而，用户同时打开多个浏览器窗口或标签访问互联网资源时，就为 CSRF 攻击篡夺用户的会话 Cookie 创造了条件。却不能保证请求本身是用户自愿发出的。其最典型的例子**就是当 cookie 还没过期时，用户浏览的网站有与其没过期的网站的一些 api 请求，那么当用户浏览这个恶意网站时就可能会受到危害**。
![](https://cdn.jsdelivr.net/gh/PancakeDogLLL/imageBed/img/202112161949.png)
**会话定置(Session Fixation)攻击**是指，攻击者向受害者主机注入自己控制的认证 Cookie 等信息，使得受害者以攻击者的身份登录网站，从而窃取受害者的会话信息。注入 Cookie 的方法包括：使用跨站脚本或木马等恶意程序；或伪造与合法网站同域的站点，并利用各种方法欺骗用户访问该仿冒网站，从而通过 HTTP 响应中的 Set-Cookie 头将攻击者拥有的该域 Cookie 发送给用户等。因为 sessionID 一般都会放在 cookie 中存储，所以会容易受到会话定制攻击。

### Session

#### 概念

与 cookie 相比，session 就是存放在服务端了，它表示在客户端登录时，服务端会发放一个 sessionid 到客户端，它一般存在 cookie 中，所以客户端以后的请求就会在请求头的 cookies 字段中携带这个信息。这样服务端就可以通过这个数据判断客户端的登录状态。这就好比我们去点菜，点好了后商家给我们一个号码牌，等菜好了，就送往相应号码牌的位置。

#### 安全性

因为 session 是放在服务器上的，所以一般的安全性就考虑 sessionid 的伪造与截获。如果 sessionid 是放在 cookie 中的，那么 cookie 的时效就决定了 sessionid 即登录状态的时效。
需要注意的就是会话固定（session fixation)：意思是攻击者先自己获取一个 sessionid,然后假冒一个网站并将连接发给被攻击的人，当受害者登录后，攻击者就可以劫持受害人的会话。因为在攻击者登录获取 sessionid 后，网络服务器看到会话已经建立，无需创建新的会话。所以攻击者就成功地冒充了受害者，从而获取了受害者的信息。

### Token（JWT）

#### 概念：

JSON Web Token (JWT) 是一种开放标准 (RFC 7519)，它定义了一种紧凑且自包含的方式，用于在各方之间作为 JSON 对象安全地传输信息。由于此信息经过数字签名，因此可以验证和信任。 JWT 可以使用秘密（使用 HMAC 算法）或使用 RSA 或 ECDSA 的公钥/私钥对进行签名。尽管 JWTs 可以被加密，以便在各方之间提供保密性，但我们将专注于签名的令牌。签名的令牌可以验证其中包含的索赔的完整性，而加密的令牌则对其他各方隐藏这些索赔。当令牌使用公钥/私钥对签名时，签名也证明了只有持有私钥的一方才是签名者。 - - - - https://jwt.io/introduction

#### 组成：

> 形如：xxxxx.yyyyy.zzzzz

1. header：标头通常由两部分组成：令牌的类型，即 JWT，以及正在使用的签名算法，例如 HMAC SHA256 或 RSA。**然后，这个 JSON 被 Base64Url 编码以形成 JWT 的第一部分。**

```javascript
{
  "alg": "HS256",
  "typ": "JWT"
}
```

2. payload：包含一些声明， 声明是关于实体（通常是用户）和附加数据的声明。共有三种类型的 claims：注册负载、公共负载和私人负载。

- Registered claims（注册）: 通常有四个部分，iss(issuer)，exp (expiration time), sub (subject), aud (audience)。还有一些其他的，比如：nbf (Not Before)、iat (Issued At)、jti (JWT ID)。
  **iss（issuer）**：声明标识发行该证书的委托人。
  **exp (expiration time)**：声明标识了过期时间或之后不得接受 JWT 进行处理
  **sub (subject)**：JWT 的主题。 JWT 中的声明通常是声明，关于主题。主题值必须要么被限定为在发行人的上下文中是本地唯一的，或者是全球唯一的。
  **aud (audience)**：声明标识了 JWT 的接收者。
- Public claims（公共）：这些可以由使用 JWT 的人随意定义。但是为了避免冲突，它们应该在 [IANA JSON Web Token Registry](https://www.iana.org/assignments/jwt/jwt.xhtml) 中定义，或者定义为包含抗冲突命名空间的 URI。
- Private claims（私有）：这些是为了在同意使用它们的各方之间共享信息而创建的自定义声明，这些声明既不是注册声明也不是公开声明。此声明的处理通常是**特定于应用程序**的。

**然后，这个 JSON 被 Base64Url 编码以形成 JWT 的第二部分。**
**这里，header 与 payload 都是可以直接通过 base64url 解码获得其 json 数据的。** 3. signature：签名，这是 jwt 最核心的部分，就是包含 base64 编码的 header,payload,以及 secret，最后再将整个使用加密算法进行加密。其中的 secret 就是服务端发放的私钥。

> 形如：
> HMACSHA256(
> base64UrlEncode(header) + "." +
> base64UrlEncode(payload),
> secret
> )

#### 使用

每当用户想要访问受保护的路由或资源时，用户代理应发送 JWT，通常在使用 Bearer 模式的 Authorization 标头中。标题的内容应如下所示：

```javascript
Authorization: Bearer <token>
```

如果令牌在 Authorization 标头中发送，则跨源资源共享 (CORS) 不会成为问题，因为它不使用 cookie（cookie 是不能跨域的）。这一点就非常适合单点登录。

#### 安全性

因为在 jwt 签发的时候，密钥是服务端生成的，所以来说是比较安全的，当 payload 的数据修改后，发送给服务端，服务端会采用相同的加密算法生成一个 token 副本与之前签发的进行对比，显然，修改后的数据再次加密后与之前的 token 对比肯定不同。
在 payload 中，因为是 base64url 编码的，所以很容易解码获取信息，因此不宜在里面放一些比较重要的信息。

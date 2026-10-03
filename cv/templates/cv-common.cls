\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{cv-common}[2026/10/03 Shared layout for the industry and academic CVs]
% Scalable CM math fonts for the radical in \cvsqrt at small text sizes.
\RequirePackage{fix-cm}
\LoadClass[a4paper]{article}

\RequirePackage{iftex}
\RequireXeTeX
\RequirePackage[a4paper,top=14mm,bottom=17mm,left=17mm,right=17mm,footskip=8mm,headheight=0pt,headsep=0pt]{geometry}
\RequirePackage{fontspec}
\RequirePackage{xcolor}
\RequirePackage{etoolbox}
\RequirePackage{ragged2e}
\RequirePackage{fancyhdr}
\RequirePackage[protrusion=true,final]{microtype}
\RequirePackage[bookmarks=false]{hyperref}

% ---------------------------------------------------------------- fonts & colours
\setmainfont{Iowan Old Style}[Ligatures=TeX]
\newfontfamily\cvsans{Avenir Next}[Ligatures=TeX, BoldFont={Avenir Next Demi Bold}]
\newfontfamily\cvsansmedium{Avenir Next Medium}[Ligatures=TeX]
\setmonofont{Menlo}[Scale=MatchLowercase]

\definecolor{cvaccent}{HTML}{B5432A}
\definecolor{cvink}{HTML}{1D1B16}
\definecolor{cvmuted}{HTML}{6B6457}
\definecolor{cvrule}{HTML}{D6CDBE}

\hypersetup{colorlinks=true, allcolors=cvaccent, pdfcreator={scripts/build-cv.mjs (XeLaTeX)},
  pdflang=en, pdfdisplaydoctitle=true}

% ---------------------------------------------------------------- sizes
\newcommand\cvsetsize[2]{%
  \renewcommand\normalsize{\fontsize{#1}{#2}\selectfont}%
  \renewcommand\small{\fontsize{\the\dimexpr#1-0.9pt\relax}{\the\dimexpr#2-1.1pt\relax}\selectfont}%
  \renewcommand\footnotesize{\fontsize{\the\dimexpr#1-1.6pt\relax}{\the\dimexpr#2-2pt\relax}\selectfont}%
  \normalsize}
\cvsetsize{10pt}{13pt}

\newcommand\cvmeta{\cvsansmedium\fontsize{7.6pt}{9.5pt}\selectfont\color{cvmuted}}
\newcommand\cvtagfont{\ttfamily\fontsize{6.6pt}{8pt}\selectfont}
\newcommand\cvsecfont{\fontsize{10.8pt}{13pt}\selectfont\addfontfeature{Letters={SmallCaps,UppercaseSmallCaps},LetterSpace=9}}
\newcommand\cvsubfont{\cvsans\bfseries\fontsize{7.4pt}{9pt}\selectfont\addfontfeature{LetterSpace=8}\MakeUppercase}

% ---------------------------------------------------------------- spacing
\newlength\cvsecbefore  \setlength\cvsecbefore{9pt plus 3pt minus 1.5pt}
\newlength\cvsecafter   \setlength\cvsecafter{4pt}
\newlength\cventryskip  \setlength\cventryskip{6pt plus 2pt minus 1pt}
\newlength\cvitemskip   \setlength\cvitemskip{2.6pt plus 1pt}
\newlength\cvdatecol    \setlength\cvdatecol{24mm}
\newlength\cvlabelcol   \setlength\cvlabelcol{34mm}
\newlength\cvgap        \setlength\cvgap{4mm}

\setlength\parindent{0pt}
\setlength\parskip{0pt}
\frenchspacing
\raggedbottom
\clubpenalty=10000
\widowpenalty=10000
\displaywidowpenalty=10000
\emergencystretch=1.5em
\setlength\RaggedRightRightskip{0pt plus 4em}
\setlength\RaggedRightParindent{0pt}
\setlength\JustifyingParindent{0pt}

% Date column on the left (academic) or flush-right dates (industry).
\newif\ifcv@leftdates
\newcommand\cvleftdates{\cv@leftdatestrue}
\newcommand\cvrightdates{\cv@leftdatesfalse}
\newcommand\cv@bodyindent{\ifcv@leftdates\leftskip=\cvdatecol\else\leftskip=\z@\fi}
\AtBeginDocument{\color{cvink}\RaggedRight\cv@bodyindent}

% ---------------------------------------------------------------- helpers
\newcommand\cvsqrt[1]{\ensuremath{\sqrt{\hbox{\itshape #1}}}}
\newcommand\cvsep{\unskip\nobreak\enspace{\color{cvaccent}\textperiodcentered}\hskip0.5em plus 0.2em minus 0.1em\ignorespaces}
\newcommand\cvtag[1]{\unskip\enspace{\cvtagfont\color{cvaccent}\MakeUppercase{#1}}}
\newcommand\cvnote[1]{{\small\color{cvmuted}#1}}

% Needspace (needspace.sty is not in TeX Live basic).
\newcommand\cv@needspace[1]{\par\penalty-100\begingroup\setlength{\dimen@}{#1}%
  \dimen@ii\pagegoal\advance\dimen@ii-\pagetotal
  \ifdim\dimen@>\dimen@ii\ifdim\dimen@ii>\z@\vfil\fi\penalty-\@M\fi\endgroup}

% Right-aligned tail on the last line of a paragraph (TeXbook, ch. 14).
\newcommand\cv@flushright[1]{{\unskip\nobreak\hfil\penalty50\hskip1.2em\hbox{}\nobreak\hfil
  \mbox{\cvmeta#1}\parfillskip=\z@\finalhyphendemerits=\z@\par}}

% \leavevmode first: a leading \color whatsit would become the [t] anchor of the parbox.
\newcommand\cv@leftdate[1]{\llap{\smash{\parbox[t]{\dimexpr\cvdatecol-\cvgap\relax}{%
  \RaggedRight\leavevmode\cvmeta\strut#1}}\hspace{\cvgap}}}

% ---------------------------------------------------------------- header & footer
% \cvheader{name}{role}{position line}{contact lines separated by \\}
\newcommand\cvheader[4]{%
  \begingroup\leftskip\z@
  \noindent
  \begin{minipage}[b]{0.64\linewidth}\RaggedRight
    {\fontsize{24pt}{27pt}\selectfont\addfontfeature{LetterSpace=1.5}#1}\par\vspace{4.5pt}
    {\color{cvaccent}\fontsize{10.4pt}{12.5pt}\selectfont\addfontfeature{Letters={SmallCaps,UppercaseSmallCaps},LetterSpace=8}#2}%
    \ifblank{#3}{}{\par\vspace{1.5pt}{\small\itshape\color{cvmuted}#3}}%
  \end{minipage}\hfill
  \begin{minipage}[b]{0.34\linewidth}\raggedleft
    {\cvsans\fontsize{8.2pt}{11pt}\selectfont\color{cvmuted}#4}%
  \end{minipage}\par
  \vspace{7pt}{\color{cvaccent}\hrule height 0.7pt}\vspace{2pt}%
  \par\endgroup}

\providecommand\cv@lastpage{}
% Deferred \write: \thepage expands when the last page is shipped out.
\AtEndDocument{\par\write\@auxout{\gdef\string\cv@lastpage{\thepage}}}
\newcommand\cv@pageof{p.~\thepage\ifx\cv@lastpage\@empty\else\ of~\cv@lastpage\fi}

% \cvfooter{left text}{updated}
\newcommand\cvfooter[2]{%
  \pagestyle{fancy}\fancyhf{}%
  \renewcommand\headrulewidth{0pt}\renewcommand\footrulewidth{0pt}%
  \fancyfoot[L]{\cvmeta #1\cvsep\cv@pageof}%
  \fancyfoot[R]{\cvmeta Last updated #2}}

% ---------------------------------------------------------------- sections
\newcommand\cvsection[1]{%
  \cv@needspace{4\baselineskip}\vspace{\cvsecbefore}%
  {\leftskip\z@\noindent{\cvsecfont\color{cvaccent}#1}\hspace{0.8em}%
   {\color{cvrule}\leaders\hrule height 3.1pt depth -2.5pt\hfill}\par}%
  \nobreak\vspace{\cvsecafter}\@afterheading}

\newcommand\cvsubsection[1]{%
  \cv@needspace{3\baselineskip}\addvspace{6pt plus 2pt}%
  \noindent{\color{cvmuted}\cvsubfont{#1}}\par\nobreak\vspace{2pt}\@afterheading}

% \cventry{title}{organisation}{dates}{location}
\newcommand\cventry[4]{%
  \par\addvspace{\cventryskip}\cv@needspace{3\baselineskip}%
  \ifcv@leftdates
    \noindent\cv@leftdate{#3}{\bfseries #1}\par\nobreak
    \ifblank{#2#4}{}{\noindent{\itshape #2}\ifblank{#4}{\par}{\cv@flushright{#4}}\nobreak}%
  \else
    \noindent{\bfseries #1}\cv@flushright{#3}\nobreak
    \ifblank{#2#4}{}{\noindent{\itshape #2}\ifblank{#4}{\par}{\cv@flushright{#4}}\nobreak}%
  \fi
  \vspace{1pt}}

% \cvitem{date}{text}: one dated paragraph (date left or flush right).
\newcommand\cvitem[2]{%
  \par\addvspace{\cvitemskip}%
  \ifcv@leftdates\noindent\cv@leftdate{#1}#2\par
  \else\noindent#2\ifblank{#1}{\par}{\cv@flushright{#1}}\fi}

% \cvnumbered{label}{text}: hanging numbered item (publications).
\newcommand\cvnumbered[2]{%
  \par\addvspace{\cvitemskip}%
  \ifcv@leftdates
    \noindent\llap{{\cvmeta #1}\hspace{\cvgap}}#2\par
  \else
    {\hangindent=1.6em\hangafter=1\noindent\makebox[1.6em][l]{\cvmeta #1}#2\par}%
  \fi}

% \cvrow{label}{text}: labelled row (skills, languages).
\newcommand\cvrow[2]{%
  \par\addvspace{\cvitemskip}%
  \ifcv@leftdates
    \noindent\llap{\smash{\parbox[t]{\dimexpr\cvdatecol-\cvgap\relax}{\RaggedRight\hyphenpenalty=\@M
      \leavevmode\cvsansmedium\fontsize{7.6pt}{9.5pt}\selectfont\color{cvink}\strut#1}}\hspace{\cvgap}}#2\par
  \else
    \noindent\parbox[t]{\cvlabelcol}{\RaggedRight\hyphenpenalty=\@M\leavevmode\cvsansmedium\fontsize{7.8pt}{10pt}\selectfont
      \strut#1}\hspace{\cvgap}%
    \parbox[t]{\dimexpr\linewidth-\cvlabelcol-\cvgap\relax}{\RaggedRight\strut#2\strut}\par
  \fi}

\newcommand\cv@bullet{\textcolor{cvaccent}{\raisebox{0.2ex}{\fontsize{6pt}{6pt}\selectfont\textbullet}}}
\newenvironment{cvitems}{%
  \begin{list}{\cv@bullet}{%
    \setlength\leftmargin{\dimexpr1.05em\ifcv@leftdates+\cvdatecol\fi\relax}%
    \setlength\labelwidth{0.6em}\setlength\labelsep{0.45em}%
    \setlength\itemsep{0.8pt plus 0.5pt}\setlength\parsep{0pt}\setlength\topsep{1.5pt}%
    \setlength\partopsep{0pt}\setlength\itemindent{0pt}\setlength\listparindent{0pt}}%
  \leftskip\z@}{\end{list}}

% \cvcaprow{title}{text}{title}{text}: two capability cards side by side.
\newcommand\cv@cap[2]{{\color{cvaccent}\vrule width 0.9pt}\hspace{5pt}%
  \parbox[t]{\dimexpr\linewidth-5.9pt\relax}{\RaggedRight{\bfseries #1}\par\vspace{0.5pt}#2}}
\newcommand\cvcaprow[4]{%
  \par\addvspace{4.5pt plus 1pt}%
  \noindent\begin{minipage}[t]{\dimexpr0.5\linewidth-0.8em\relax}\cv@cap{#1}{#2}\end{minipage}%
  \hfill
  \begin{minipage}[t]{\dimexpr0.5\linewidth-0.8em\relax}\ifblank{#3}{}{\cv@cap{#3}{#4}}\end{minipage}\par}

\newcommand\cvtools[1]{\par\vspace{1.5pt}\noindent{\cvmeta #1}\par}

\newcommand\cvprose[1]{{\justifying\cv@bodyindent #1\par}}

\endinput

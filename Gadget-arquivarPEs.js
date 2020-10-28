// Author: Francisco Venancio ([[Usuário:Chicocvenancio]])
/* jshint laxbreak: true, esversion: 8 */
/* global jQuery, mediaWiki */

( function ( $, mw ) {
'use strict';

var api = new mw.Api(),
	ape = {},
	months = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ],
	date = new Date(),
	withScript = '; processo assistido por [[Usuário:Chicocvenancio/arquivarPEs|um script]]';

ape.getWikiText = async function ( title) {
	let data = await api.get( {
		prop: 'revisions',
		rvprop: 'content',
		rvlimit: 1,
		indexpageids: true,
		titles: title
	} );
	let q = data.query;
	let id = q && q.pageids && q.pageids[ 0 ];
	let pg = id && q.pages && q.pages[ id ];
	let rv = pg && pg.revisions;
	if ( rv && rv[ 0 ] && rv[ 0 ][ '*' ] ) {
		return rv[ 0 ][ '*' ];
	} else {
		throw new Error(`Página ${title} não existe.`);
	}
};

ape.editPage = async function ( title, text, summary) {
	return await api.post( {
		action: 'edit',
		title: title,
		text: text,
		summary: summary,
		token : mw.user.tokens.get( 'csrfToken' )
	} );
};

ape.startArchive = async function ( pfdwText ) {
	var notFinishedRegex = /\{\{Nomeação não concluída\|(\d*)(|\|prog=.*)\}\}/g,
		matchRegex = notFinishedRegex.exec( pfdwText );

	 if ( !matchRegex) {
	 	return ape.useDialog(
	 		'Problema',
	 		'Predefinição de PE inconclusa não encontrada, por favor verifique a página da PE pela predefinição {{Nomeação não concluída|data (yyyymmdd)}}',
	 		'nprompt-dialog'
	 	);
	 }

	date.iso = matchRegex[ 1 ];
	date.setFullYear( date.iso.substring( 0, 4 ), parseInt( date.iso.substring( 4, 6 ) - 1, 10 ), parseInt( date.iso.substring( 6, 8 ), 10 ) );

	if ( matchRegex[ 2 ] ) {
		date.setDate( date.getDate() + 7 );
	}

	switch ( ape.result ) {
		case 'Inconclusivo/':
			ape.useDialog( 'Em progresso', 'Mudando predefinição em PE', 'nprompt-dialog' );
			ape.result = 'Arquivo de mantidas/';
			ape.inconclusive = 1;
			await ape.editPage(
				mw.config.get( 'wgPageName' ),
				pfdwText.replace( notFinishedRegex, '{{Nomeação concluída|~~' + '~~' + '~|Inconclusiva}}' ),
				'Fechando PE' + withScript);
			ape.pages.each(async function(i, pageLink) {
				let page = pageLink.text;
				await ape.removeTemplate(page);
			});
		break;

		case 'Arquivo de eliminadas/':
			ape.useDialog( 'Em progresso', 'Mudando predefinição em PE', 'nprompt-dialog' );
			ape.editPage(
				mw.config.get( 'wgPageName' ),
				pfdwText.replace( notFinishedRegex, '{{Nomeação concluída|~~' + '~~' + '~|Eliminada$2}}' ),
				'Fechando PE' + withScript);
			ape.pages.each(async function(i, pageLink) {
				let page = pageLink.text;
			    ape.deletePage(page);
			    ape.deleteTalkPage(page);
			});
		break;

		case 'Arquivo de mantidas/':
			ape.useDialog( 'Em progresso', 'Mudando predefinição em PE', 'nprompt-dialog' );
			await ape.editPage(
				mw.config.get( 'wgPageName' ),
				pfdwText.replace( notFinishedRegex, '{{Nomeação concluída|~~' + '~~' + '~|Mantida}}' ),
				'Fechando PE' + withScript);
			ape.pages.each(async function(i, pageLink) {
				let page = pageLink.text;
				await ape.removeTemplate(page);
			});
		break;


		case 'Redirecionar/':
			ape.useDialog( 'Em progresso', 'Mudando predefinição em PE', 'nprompt-dialog' );
			await ape.editPage(
				mw.config.get( 'wgPageName' ),
				pfdwText.replace( notFinishedRegex, '{{Nomeação concluída|~~' + '~~' + '~|Redirecionar}}' ),
				'Fechando PE' + withScript);
				ape.pages.each(async function(i, pageLink) {
					let page = pageLink.text;
					ape.editPage(
						page,
						'#REDIRECIONAMENTO [[' + window.prompt( `Redirecionar ${page} para qual página?` ) + ']]',
						'Redirecionando página' + withScript);	
				});
		break;

		case 'Prorrogar/': // Prorrogar foi depreciado pela comunidade 
			ape.useDialog('Erro!', 'Por <a href="https://pt.wikipedia.org/wiki/Wikip%C3%A9dia:Esplanada/propostas/Acabar_com_as_prorroga%C3%A7%C3%B5es_de_vota%C3%A7%C3%A3o_em_Elimina%C3%A7%C3%B5es_por_Consenso_(18dez2016)" title="Wikipédia:Esplanada/propostas/Acabar com as prorrogações de votação em Eliminações por Consenso (18dez2016)">decisão da comunidade</a> não se deve mais prorrogar PEs', 'nprompt-dialog');
			//	ape.useDialog( 'Em progresso', 'Prorrogando a página', 'nprompt-dialog' );
			//	
			//	if ( matchRegex[ 2 ] ) {
			//		return ape.useDialog( 'Erro!', 'Esta PE já está prorrogada.', 'nprompt-dialog' );
			//	
			//	}
			//	
			//	prog = matchRegex[ 0 ].replace( /\}\}/, '|prog=1|~~' + '~~}}' );
			//	ape.editPage(
			//		'Wikipédia:Páginas para eliminar/' + page, pfdwText.replace( notFinishedRegex, prog ),
			//		'Prorrogando PE' + withScript, function () {
			//			ape.useDialog( 'Sucesso', 'PE Prorrogada', 'nprompt-dialog' );
			//		},
			//		ape.ajaxErr
			//	);
		break;


	}
	await ape.archivePage();
};

ape.addArchiveLink = function ( element ) {
	var archivePFD = $( '<a href="#">Arquivar</a>' ).click( function ( e ) {
		e.preventDefault();

		ape.nicePrompt(
			'Que tipo de arquivamento deseja fazer?',
			async function ( result ) {
				ape.result = result;
				ape.useDialog( 'Em progresso', 'Buscando wikitexto da PE', 'nprompt-dialog' );
				let PEtext = await ape.getWikiText( mw.config.get( 'wgPageName' ));
				ape.startArchive(PEtext);
			}
		);
	} );

	$( $( element ).children()[ 1 ] ).before( $( archivePFD ) ).before( ' | ' ).after( ' ' );
};


// TODO: make single edit with more than one page
ape.archivePage = async function () {
	var date = new Date();

	ape.fullArchivePage = 'Wikipédia:Páginas para eliminar/' + ( ape.result !== 'Redirecionar/' ? ape.result : 'Arquivo de mantidas/' ) + months[ date.getMonth() ] + ' ' + date.getFullYear();
	ape.useDialog( 'Em progresso', 'Arquivando página', 'nprompt-dialog' );
    let appendtext = '';
    let page;
	ape.pages.each( function(i, pageLink) {
		page = pageLink.text;
		appendtext += `\n* [[${mw.config.get( 'wgPageName' )}| ${page}]] – [[:${page}]]` + ( ape.result === 'Redirecionar/' ? ' - redirecionado' : '' ) + ( ape.result === 'Inconclusivo/' ? ' - inconclusiva' : '' );
	});
	return await api.post( {
		action: 'edit',
		minor: false,
		title: ape.fullArchivePage,
		appendtext: appendtext,
		section: date.getDate(),
		summary: 'arquivando [[' + page + ']]' + withScript,
		token: mw.user.tokens.get( 'csrfToken' )
	} )
	.done( ape.backlinks )
	.fail( ape.ajaxErr );
};

ape.backlinks = function () {
	if ( ape.result === 'Arquivo de eliminadas/' ) {
		ape.useDialog( 'Em progresso', 'Procurando afluentes', 'nprompt-dialog' );
		api.get( {
			action: 'query',
			list: 'backlinks',
			bltitle: ape.page,
			blnamespace: '0|8|10|12|14|100|102',
			bllimit: '80',
			blredirect: '1'
		} ).done( ape.embedded ).fail( ape.backlinksFail );
	} else {
		ape.success();
	}
};

ape.embedded = function ( result ) {
	var i,
		numberOfBl = result.query.backlinks.length;

	for ( i = 0; i < result.query.backlinks.length; i += 1 ) {
		if ( result.query.backlinks[ i ].redirlink ) {
			numberOfBl += result.query.backlinks[ i ].redirlink.length;
		}
	}

	ape.numberOfBl = numberOfBl;
	api.get( {
		action: 'query',
		list: 'embeddedin',
		eititle: ape.page,
		einamespace: '0|8|10|12|14|100|102',
		eilimit: '80'
	} ).done( ape.success ).fail( ape.backlinksFail );
};

ape.backlinksFail = function () {
	ape.useDialog(
		'Quase sucesso',
		'Houve um erro ao verficar afluentes do artigo, por favor faça manualmente.<br /> Sucesso em arquivar! (<a href="' + mw.util.getUrl( ape.fullArchivePage ) +
			'#' + ape.day + '_de_' + mw.config.get( 'wgMonthNames' )[ date.getMonth() + 1 ] + '">Abrir</a>) <a href="' +
			mw.util.getUrl( ape.fullArchivePage ) + '?diff=0">(diff)</a>' + '<br /> Verifique as suas ações.',
		'nprompt-dialog'
	);
};

ape.success = function ( result ) {
	var i, embeddedin;

	if ( result ) {
		embeddedin = result.query.embeddedin.length;

		for ( i = 0; i < result.query.embeddedin.length; i += 1 ) {
			if ( result.query.embeddedin[ i ].redirlink ) {
				embeddedin += result.query.embeddedin[ i ].redirlink.length;
			}
		}

		ape.numberOfBl += embeddedin;

		if ( ape.numberOfBl >= 80 ) {
			ape.numberOfBl = '80 ou mais afluentes';
		}
	}

	ape.useDialog(
		'Sucesso',
		'Sucesso em arquivar! (<a href="' + mw.util.getUrl( ape.fullArchivePage ) + //mensagem de sucesso
			'#' + ape.day + '_de_' + mw.config.get( 'wgMonthNames' )[ date.getMonth() ] + '">Abrir</a>) <a href="' +
			mw.util.getUrl( ape.fullArchivePage, { diff: 0 } ) + '">(diff)</a>' + ( ape.result === 'Arquivo de eliminadas/' ? '<br />'	+
			( ape.numberOfBl === 0 ? 'Não há afluentes para esse artigo' : 'Há ' + ape.numberOfBl + ' <a href="' + mw.util.getUrl( 'Especial:Páginas afluentes/' + ape.page ) +
			'" >afluentes</a> para esse artigo' ) : '' ) + '<br /> Verifique as suas ações.',
		'nprompt-dialog'
	);
};

ape.ajaxErr = function ( code, result ) {
	ape.useDialog( 'Erro!!', 'Houve um erro ao requisitar a edição da página. Código: "' + code + '". ' + result.error.info, 'nprompt-dialog' );
};

ape.talkPageErr = function ( code, result ) {
	if ( code !== 'missingtitle' ) {
		ape.ajaxErr( code, result );
	}
};

ape.deleteTalkPage = function (page) {
	var title,
		collon = page.indexOf( ':' );

	ape.useDialog( 'Em progresso', 'Eliminando a página de discussão ' + page, 'nprompt-dialog' );

	if ( collon === -1 ) {
		title = 'Discussão:' + page;
	} else {
		title = page.substring( 0, collon ) + ' Discussão' + page.substring( collon );
	}

	api.post( {
		action : 'delete',
		title : title,
		reason: `Discussão de página eliminada por [[${mw.config.get( 'wgPageName' )}|PE]] ${withScript} `,
		token : mw.user.tokens.get( 'csrfToken' )
	} )
	.fail( ape.talkPageErr );
};

ape.deletePage = function (page) {
	ape.useDialog( 'Em progresso', 'Eliminando a página ' + page, 'nprompt-dialog' );
	return api.post( {
		action : 'delete',
		title : page,
		reason: `Decidido em [[${mw.config.get( 'wgPageName' )}|PE]] ${withScript}`,
		token : mw.user.tokens.get( 'csrfToken' )
	} );
};

ape.removeTemplate = async function (page) {
	ape.useDialog( 'Em progresso', 'Retirando {{apagar4}} da página ' + page, 'nprompt-dialog' );
	let wtext = await ape.getWikiText(page);
	await ape.editPage(
		page,
		wtext.replace( /\{\{\s*apagar4[^\}]+\}\}\n/g, '' ),
		'Retirando {{apagar4}}' + withScript);
	await ape.addOldPfdTemplate(page);

};

ape.addOldPfdTemplate = async function (page) {
	var title, textoTopo,
		collon = page.indexOf( ':' );

	ape.useDialog( 'Em progresso', 'Adicionando {{antigaPE}} na página de discussão' , 'nprompt-dialog' );

	if ( collon === -1 ) {
		title = 'Discussão:' + page;
	} else {
		title = page.substring( 0, collon ) + ' Discussão' + page.substring( collon );
	}
	if ( ape.inconclusive ) {
		textoTopo = '{{antigaPE|resultado=inconclusivo|';
	} else {
		textoTopo = '{{antigaPE|resultado=manter|';
	}
	textoTopo += page + '}}\n\n';
	return await api.post( {
		action: 'edit',
		title: title,
		prependtext : textoTopo,
		summary: 'Adicionando predefinição de antigaPE' + withScript,
		token: mw.user.tokens.get( 'csrfToken' )
	} );
};

ape.nicePrompt = function ( title, callback ) {
	$( '<div id="nprompt-dialog" class="ui-widget">'
	    + (ape.pages.length > 1 ? '<span style="float: right;width: 50%;"> Temos várias páginas nessa PE, a ação de arquivamento <b>se aplicará a todas</b></span>': '')
		+ '<input type="radio" name="nprompt-input-radio" value="Inconclusivo/" />Inconclusiva <br />'
		+ '<input type="radio" name="nprompt-input-radio" value="Redirecionar/" />Redirecionar<br />'
		+ '<input type="radio" name="nprompt-input-radio" value="Arquivo de mantidas/" />Mantida <br />'
		+ '<input type="radio" name="nprompt-input-radio" value="Arquivo de eliminadas/" />Eliminada<br />'
		// + '<input type="radio" name="nprompt-input-radio" value="Prorrogar/" />Prorrogar' // Prorrogar foi depreciado com a decisão da comunidade [[Wikipédia:Esplanada/propostas/Acabar com as prorrogações de votação em Eliminações por Consenso (18dez2016)]]
	+ '</div>' ).dialog( {
		title: title,
		open: function () {
			$( '.ui-dialog-titlebar-close' ).hide();
		},
		close: function () {
			$( '#nprompt-dialog' ).dialog( 'destroy' );
			$( '#nprompt-dialog' ).remove();
		},
		buttons: {
			'OK': function () {
			callback( $( 'input[name=nprompt-input-radio]:checked' ).val() );
			},
			'Cancelar': function () {
				ape.useDialog( 'Ah!', 'Você cancelou!', 'nprompt-dialog' );
			}
		}
	} );
};

ape.useDialog = function ( title, message, id ) {
	$( '#' + id )
		.empty()
		.dialog( 'option', 'title', title )
		.append( $( '<div>' + message + '</div>' ) )
		.dialog( 'option', 'buttons', {
			'Fechar': function () {
				$( this ).dialog( 'close' );
			}
		} );
};
ape.pages = $( '.PEferramentas' ).children(':first-child');
$( '.PEferramentas' ).each( function() {ape.addArchiveLink(this);} );

}( jQuery, mediaWiki ) );

// [[Categoria:!Código-fonte de scripts|Arquivar PEs]]
